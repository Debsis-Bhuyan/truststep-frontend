import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MilestoneService } from '../../../core/services/milestone.service';
import { LoanService } from '../../../core/services/loan.service';
import { AuthService } from '../../../core/services/auth.service';
import { MilestoneResponse } from '../../../core/models/milestone.model';
import { LoanResponse } from '../../../core/models/loan.model';

@Component({
  selector: 'app-milestone-topup',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">Borrow from a Future Milestone</h1>
      <p class="page-subtitle">Reason required · proof optional · manager approval required</p>
    </div>

    <div class="max-w-lg">
      <div class="card">
        @if (success()) {
          <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4 text-emerald-700 text-sm">
            ✅ Request sent to manager. Funds will be released after approval.
          </div>
        }
        @if (error()) { <div class="warning-bar mb-4">⚠️ {{ error() }}</div> }

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label class="form-label">Amount needed (₹)</label>
            <input formControlName="amount" type="number" class="form-input" placeholder="5000">
            @if (form.get('amount')?.invalid && form.get('amount')?.touched) {
              <p class="form-error">Enter a valid amount</p>
            }
          </div>

          <div>
            <label class="form-label">Borrow from milestone</label>
            <select formControlName="fromMilestoneId" class="form-select">
              <option value="">Select future milestone…</option>
              @for (m of futureMilestones(); track m.milestoneId) {
                <option [value]="m.milestoneId">
                  M{{ m.phaseNumber }} · {{ m.description }} ({{ inr(m.allocatedAmount) }})
                </option>
              }
            </select>
            @if (form.get('fromMilestoneId')?.invalid && form.get('fromMilestoneId')?.touched) {
              <p class="form-error">Select a milestone</p>
            }
          </div>

          <div>
            <label class="form-label">Reason <span class="badge-red ml-1 text-xs">required</span></label>
            <textarea formControlName="reason" class="form-input min-h-[80px] resize-none"
                      placeholder="Why you need it…"></textarea>
            @if (form.get('reason')?.invalid && form.get('reason')?.touched) {
              <p class="form-error">Reason required</p>
            }
          </div>

          <div>
            <label class="form-label">Proof URL <span class="badge-slate ml-1 text-xs">optional</span></label>
            <input formControlName="proofUrl" class="form-input" placeholder="Link to proof document…">
          </div>

          <div class="info-bar">
            ℹ️ Manager approval is required before funds are released.
          </div>

          <button type="submit" [disabled]="loading()" class="btn-primary w-full">
            @if (loading()) { <span class="spinner w-4 h-4"></span> }
            Send request to manager
          </button>
        </form>
      </div>
    </div>
  `
})
export class MilestoneTopupComponent implements OnInit {
  form: FormGroup;
  futureMilestones = signal<MilestoneResponse[]>([]);
  loading = signal(false);
  error = signal('');
  success = signal(false);
  private loanId: number | null = null;

  constructor(private fb: FormBuilder, private mSvc: MilestoneService,
              private loanSvc: LoanService, private auth: AuthService) {
    this.form = this.fb.group({
      amount:          [null, [Validators.required, Validators.min(1)]],
      fromMilestoneId: ['',   Validators.required],
      reason:          ['',   Validators.required],
      proofUrl:        ['']
    });
  }

  ngOnInit() {
    const uid = this.auth.currentUser()?.id;
    if (!uid) return;
    this.loanSvc.getLoansByBorrower(uid).subscribe(res => {
      const loan = res.data?.find((l: LoanResponse) => ['ACTIVE', 'MORATORIUM'].includes(l.status));
      if (!loan) return;
      this.loanId = loan.loanId;
      this.mSvc.getMilestonesByLoan(loan.loanId).subscribe(r => {
        this.futureMilestones.set((r.data ?? []).filter((m: MilestoneResponse) => m.status === 'PENDING'));
      });
    });
  }

  submit() {
    if (this.form.invalid || !this.loanId) { this.form.markAllAsTouched(); return; }
    this.loading.set(true); this.error.set('');
    const { amount, fromMilestoneId, reason, proofUrl } = this.form.value;
    this.mSvc.requestReallocation({
      loanId:          this.loanId!,
      requestedById:   this.auth.currentUser()!.id,
      purpose:         'EMERGENCY_BORROW',
      fromMilestoneId: +fromMilestoneId,
      amount,
      reason,
      proofUrl:        proofUrl || undefined
    }).subscribe({
      next: () => { this.success.set(true); this.loading.set(false); this.form.reset(); },
      error: e => { this.error.set(e.error?.message ?? 'Request failed'); this.loading.set(false); }
    });
  }

  inr(v: number) { return '₹' + (v ?? 0).toLocaleString('en-IN'); }
}
