import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MilestoneService } from '../../../core/services/milestone.service';
import { LoanService } from '../../../core/services/loan.service';
import { AuthService } from '../../../core/services/auth.service';
import { MilestoneResponse } from '../../../core/models/milestone.model';

@Component({
  selector: 'app-forward-draw',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">Forward Draw</h1>
      <p class="page-subtitle">Bring forward up to 50% of a future milestone into the current phase (once per milestone)</p>
    </div>

    <div class="max-w-lg">
      <div class="card">
        @if (success()) {
          <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4 text-emerald-700 text-sm">
            ✅ Forward draw request submitted for manager approval.
          </div>
        }
        @if (error()) { <div class="warning-bar mb-4">⚠️ {{ error() }}</div> }

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label class="form-label">From (future milestone)</label>
            <select formControlName="fromMilestoneId" class="form-select" (change)="updateMax()">
              <option value="">Select future milestone…</option>
              @for (m of future(); track m.id) {
                <option [value]="m.id">M{{ m.sequenceNumber }} · {{ m.description }} ({{ inr(m.amount) }})</option>
              }
            </select>
          </div>

          <div>
            <label class="form-label">To (current milestone)</label>
            <select formControlName="toMilestoneId" class="form-select">
              <option value="">Select current milestone…</option>
              @for (m of current(); track m.id) {
                <option [value]="m.id">M{{ m.sequenceNumber }} · {{ m.description }}</option>
              }
            </select>
          </div>

          <div>
            <label class="form-label">Amount (₹) — max {{ inr(maxDraw()) }}</label>
            <input formControlName="amount" type="number" class="form-input" [placeholder]="maxDraw()">
            @if (form.get('amount')?.invalid && form.get('amount')?.touched) {
              <p class="form-error">Amount must be between 1 and {{ inr(maxDraw()) }}</p>
            }
          </div>

          <div>
            <label class="form-label">Reason <span class="badge-red ml-1 text-xs">required</span></label>
            <textarea formControlName="reason" class="form-input min-h-[80px] resize-none"
                      placeholder="Explain why you need funds early…"></textarea>
            @if (form.get('reason')?.invalid && form.get('reason')?.touched) {
              <p class="form-error">Reason required</p>
            }
          </div>

          <button type="submit" [disabled]="loading()" class="btn-primary w-full">
            @if (loading()) { <span class="spinner w-4 h-4"></span> }
            Request forward draw
          </button>
        </form>
      </div>
    </div>
  `
})
export class ForwardDrawComponent implements OnInit {
  form: FormGroup;
  allMilestones = signal<MilestoneResponse[]>([]);
  future = computed(() => this.allMilestones().filter(m => m.status === 'PENDING'));
  current = computed(() => this.allMilestones().filter(m => m.status === 'IN_PROGRESS'));
  maxDraw = signal(0);
  loading = signal(false);
  error = signal('');
  success = signal(false);
  private loanId: number | null = null;

  constructor(private fb: FormBuilder, private mSvc: MilestoneService,
              private loanSvc: LoanService, private auth: AuthService) {
    this.form = this.fb.group({
      fromMilestoneId: ['', Validators.required],
      toMilestoneId:   ['', Validators.required],
      amount:          [null, [Validators.required, Validators.min(1)]],
      reason:          ['',   Validators.required]
    });
  }

  ngOnInit() {
    const uid = this.auth.currentUser()?.id;
    if (!uid) return;
    this.loanSvc.getLoansByBorrower(uid).subscribe(res => {
      const loan = res.data?.find(l => ['ACTIVE', 'MORATORIUM'].includes(l.status));
      if (!loan) return;
      this.loanId = loan.id;
      this.mSvc.getMilestonesByLoan(loan.id).subscribe(r => this.allMilestones.set(r.data ?? []));
    });
  }

  updateMax() {
    const id = +this.form.value.fromMilestoneId;
    const m = this.future().find(x => x.id === id);
    const max = m ? Math.floor(m.amount * 0.5) : 0;
    this.maxDraw.set(max);
    this.form.get('amount')?.setValidators([Validators.required, Validators.min(1), Validators.max(max)]);
    this.form.get('amount')?.updateValueAndValidity();
  }

  submit() {
    if (this.form.invalid || !this.loanId) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const { fromMilestoneId, toMilestoneId, amount, reason } = this.form.value;
    this.mSvc.requestReallocation(this.loanId, {
      fromMilestoneId: +fromMilestoneId,
      toMilestoneId:   +toMilestoneId,
      amount, reason,
      purpose: 'FORWARD_DRAW'
    }).subscribe({
      next: () => { this.success.set(true); this.loading.set(false); this.form.reset(); },
      error: e => { this.error.set(e.error?.message ?? 'Request failed'); this.loading.set(false); }
    });
  }

  inr(v: number) { return '₹' + (v ?? 0).toLocaleString('en-IN'); }
}
