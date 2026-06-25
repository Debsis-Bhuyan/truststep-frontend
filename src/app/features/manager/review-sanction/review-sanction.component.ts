import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LoanService } from '../../../core/services/loan.service';
import { AuthService } from '../../../core/services/auth.service';
import { MilestoneService } from '../../../core/services/milestone.service';
import { LoanResponse } from '../../../core/models/loan.model';

@Component({
  selector: 'app-review-sanction',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="text-sm text-slate-400 mb-4">Loans / {{ loan()?.loanNumber }} / Review</div>

    <div class="page-header">
      <h1 class="page-title">Review & Sanction Loan</h1>
      <p class="page-subtitle">Verify KYC documents and sanction or reject the loan application</p>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16"><span class="spinner w-8 h-8"></span></div>
    } @else if (!loan()) {
      <div class="card text-center py-10 text-slate-500">Loan not found.</div>
    } @else {
      <div class="max-w-4xl grid sm:grid-cols-2 gap-4">
        <!-- Application summary -->
        <div class="card">
          <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Application</h2>
          <dl class="space-y-2.5 text-sm">
            <div class="flex justify-between"><dt class="text-slate-500">Borrower</dt><dd class="font-medium">{{ loan()!.borrowerName }}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-500">Loan #</dt><dd class="font-mono text-xs">{{ loan()!.loanNumber }}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-500">Amount</dt><dd class="font-bold text-primary-700">{{ inr(loan()!.totalApprovedAmount) }}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-500">Type</dt><dd>{{ loan()!.loanType }}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-500">Purpose</dt><dd class="text-right max-w-36">{{ loan()!.purpose }}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-500">Tenure</dt><dd>{{ loan()!.tenureMonths }} months</dd></div>
            <div class="flex justify-between"><dt class="text-slate-500">Status</dt>
              <dd><span class="badge badge-amber">{{ loan()!.status }}</span></dd>
            </div>
          </dl>
        </div>

        <!-- On sanction preview -->
        <div class="space-y-4">
          <div class="card bg-primary-50 border-primary-100">
            <h2 class="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-2">On Sanction</h2>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-500">Milestone fund (80%)</span>
                <span class="font-bold text-primary-800">{{ inr(loan()!.totalApprovedAmount * 0.8) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Emergency fund (20%)</span>
                <span class="font-bold text-emerald-700">{{ inr(loan()!.totalApprovedAmount * 0.2) }}</span>
              </div>
            </div>
          </div>

          <!-- Sanction form -->
          <div class="card">
            <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Decision</h2>

            @if (msg()) {
              <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4 text-emerald-700 text-sm">✅ {{ msg() }}</div>
            }
            @if (error()) { <div class="warning-bar mb-4">⚠️ {{ error() }}</div> }

            <form [formGroup]="form" class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="form-label text-xs">Interest rate (%)</label>
                  <input formControlName="interestRate" type="number" step="0.1" class="form-input text-sm" placeholder="11.5">
                </div>
                <div>
                  <label class="form-label text-xs">Tenure (months)</label>
                  <input formControlName="tenureMonths" type="number" class="form-input text-sm">
                </div>
              </div>
              <div>
                <label class="form-label text-xs">Remarks</label>
                <textarea formControlName="remarks" class="form-input resize-none min-h-[60px] text-sm"
                          placeholder="Optional remarks…"></textarea>
              </div>

              <div class="flex gap-3 pt-1">
                <button type="button" class="btn-success flex-1" [disabled]="actioning()" (click)="sanction()">
                  @if (actioning() === 'sanction') { <span class="spinner w-4 h-4"></span> }
                  Sanction loan
                </button>
                <button type="button" class="btn-danger px-5" [disabled]="actioning()" (click)="reject()">
                  @if (actioning() === 'reject') { <span class="spinner w-4 h-4"></span> }
                  Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `
})
export class ReviewSanctionComponent implements OnInit {
  form: FormGroup;
  loan = signal<LoanResponse | null>(null);
  loading  = signal(true);
  actioning = signal<string | null>(null);
  msg   = signal('');
  error = signal('');
  private loanId = 0;

  constructor(private fb: FormBuilder, private loanSvc: LoanService,
              private auth: AuthService, private route: ActivatedRoute,
              private mSvc: MilestoneService) {
    this.form = this.fb.group({
      interestRate:  [11.5, [Validators.required, Validators.min(0)]],
      tenureMonths:  [24,   [Validators.required, Validators.min(1)]],
      remarks:       ['']
    });
  }

  ngOnInit() {
    this.loanId = +this.route.snapshot.paramMap.get('id')!;
    this.loanSvc.getLoanById(this.loanId).subscribe({
      next: res => {
        this.loan.set(res.data);
        this.form.patchValue({ tenureMonths: res.data.tenureMonths });
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  sanction() {
    if (this.form.invalid) return;
    this.actioning.set('sanction');
    const managerId = this.auth.currentUser()!.id;
    this.loanSvc.sanctionLoan(this.loanId, managerId, this.form.value).subscribe({
      next: () => { this.msg.set('Loan sanctioned successfully! Milestone fund and emergency fund have been allocated.'); this.actioning.set(null); },
      error: e => { this.error.set(e.error?.message ?? 'Sanction failed'); this.actioning.set(null); }
    });
  }

  reject() {
    const reason = this.form.value.remarks || 'Rejected by manager';
    this.actioning.set('reject');
    this.loanSvc.rejectLoan(this.loanId, reason).subscribe({
      next: () => { this.msg.set('Loan rejected.'); this.actioning.set(null); },
      error: e => { this.error.set(e.error?.message ?? 'Reject failed'); this.actioning.set(null); }
    });
  }

  inr(v: number) { return '₹' + (v ?? 0).toLocaleString('en-IN'); }
}
