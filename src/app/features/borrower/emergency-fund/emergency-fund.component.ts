import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EmergencyService } from '../../../core/services/emergency.service';
import { LoanService } from '../../../core/services/loan.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoanResponse } from '../../../core/models/loan.model';

@Component({
  selector: 'app-emergency-fund',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <h1 class="page-title">Emergency Fund</h1>
      <p class="page-subtitle">Instant withdrawal within balance · If short, borrow from a future milestone</p>
    </div>

    <div class="max-w-2xl">
      @if (!loan()) {
        <div class="card text-center py-10 text-slate-500">No active loan found.</div>
      } @else {
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="stat-card">
            <span class="stat-label">Total Emergency Fund</span>
            <span class="stat-value text-primary-700">{{ inr(loan()!.emergencyFund) }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Available Balance</span>
            <span class="stat-value text-emerald-700">{{ inr(loan()!.emergencyBalance) }}</span>
          </div>
        </div>

        <!-- Direct withdrawal -->
        <div class="card mb-4">
          <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Withdraw — Instant (no approval within balance)
          </h2>

          @if (success()) {
            <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mt-3 text-emerald-700 text-sm">
              ✅ Withdrawal successful! Updated balance: {{ inr(loan()!.emergencyBalance - (withdrawForm.get('amountRequested')?.value ?? 0)) }}
            </div>
          }
          @if (error()) { <div class="warning-bar mt-3">⚠️ {{ error() }}</div> }

          <form [formGroup]="withdrawForm" (ngSubmit)="withdraw()" class="mt-4 space-y-4">
            <div>
              <label class="form-label">Amount (₹)</label>
              <input formControlName="amountRequested" type="number" class="form-input" placeholder="10000">
              @if (withdrawForm.get('amountRequested')?.invalid && withdrawForm.get('amountRequested')?.touched) {
                <p class="form-error">Enter a valid amount ≤ available balance</p>
              }
            </div>
            <div>
              <label class="form-label">Reason</label>
              <input formControlName="reason" class="form-input" placeholder="e.g. Urgent equipment repair">
              @if (withdrawForm.get('reason')?.invalid && withdrawForm.get('reason')?.touched) {
                <p class="form-error">Reason required</p>
              }
            </div>
            <button type="submit" [disabled]="loading()" class="btn-primary">
              @if (loading()) { <span class="spinner w-4 h-4"></span> }
              Withdraw now
            </button>
          </form>
        </div>

        <!-- Milestone borrow link -->
        <div class="card bg-amber-50 border-amber-200">
          <h2 class="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-1">Need more than available?</h2>
          <p class="text-sm text-amber-600 mb-3">
            Borrow the shortfall from a future milestone (needs manager approval).
          </p>
          <a routerLink="/borrower/milestone-topup"
             class="btn-secondary border-amber-300 text-amber-700 hover:bg-amber-100">
            Request milestone top-up →
          </a>
        </div>
      }
    </div>
  `
})
export class EmergencyFundComponent implements OnInit {
  withdrawForm: FormGroup;
  loan = signal<LoanResponse | null>(null);
  loading = signal(false);
  error = signal('');
  success = signal(false);

  constructor(private fb: FormBuilder, private eSvc: EmergencyService,
              private loanSvc: LoanService, private auth: AuthService) {
    this.withdrawForm = this.fb.group({
      amountRequested: [null, [Validators.required, Validators.min(1)]],
      reason:          ['',   Validators.required]
    });
  }

  ngOnInit() {
    const uid = this.auth.currentUser()?.id;
    if (!uid) return;
    this.loanSvc.getLoansByBorrower(uid).subscribe(res => {
      const loan = res.data?.find((l: LoanResponse) => ['ACTIVE', 'MORATORIUM'].includes(l.status));
      this.loan.set(loan ?? null);
    });
  }

  withdraw() {
    if (this.withdrawForm.invalid || !this.loan()) { this.withdrawForm.markAllAsTouched(); return; }
    const { amountRequested, reason } = this.withdrawForm.value;
    if (amountRequested > this.loan()!.emergencyBalance) {
      this.error.set(`Amount exceeds available balance of ${this.inr(this.loan()!.emergencyBalance)}`);
      return;
    }
    this.loading.set(true); this.error.set('');
    this.eSvc.directWithdraw({
      loanId:          this.loan()!.loanId,
      requestedById:   this.auth.currentUser()!.id,
      amountRequested,
      accessType:      'DIRECT',
      reason
    }).subscribe({
      next: () => { this.success.set(true); this.loading.set(false); this.withdrawForm.reset(); },
      error: e => { this.error.set(e.error?.message ?? 'Withdrawal failed'); this.loading.set(false); }
    });
  }

  inr(v: number) { return '₹' + (v ?? 0).toLocaleString('en-IN'); }
}
