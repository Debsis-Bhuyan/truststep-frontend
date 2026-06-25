import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoanService } from '../../../core/services/loan.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoanResponse } from '../../../core/models/loan.model';
import { TransactionResponse } from '../../../core/models/transaction.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/admin.model';

@Component({
  selector: 'app-loan-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">My Loan</h1>
      <p class="page-subtitle">Full loan view: funds, moratorium, interest, transactions</p>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16"><span class="spinner w-8 h-8"></span></div>
    } @else if (!loan()) {
      <div class="card text-center py-10 text-slate-500">No loan found.</div>
    } @else {
      <div class="max-w-4xl space-y-4">
        <div class="text-sm text-slate-500 mb-2">My Loan / {{ loan()!.loanNumber }}</div>

        <div class="grid sm:grid-cols-2 gap-4">
          <!-- Loan Summary -->
          <div class="card">
            <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Loan Summary</h2>
            <dl class="space-y-2.5 text-sm">
              @for (row of summary(); track row.label) {
                <div class="flex justify-between">
                  <dt class="text-slate-500">{{ row.label }}</dt>
                  <dd class="font-medium text-slate-900">{{ row.value }}</dd>
                </div>
              }
            </dl>
          </div>

          <!-- Moratorium -->
          <div class="card">
            <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Moratorium</h2>
            <dl class="space-y-2.5 text-sm">
              <div class="flex justify-between">
                <dt class="text-slate-500">Period</dt>
                <dd class="font-medium">3 months</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Simple interest</dt>
                <dd class="font-medium text-amber-700">{{ inr(simpleInterest()) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Capitalised principal</dt>
                <dd class="font-medium text-primary-700">{{ inr(capitalised()) }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Transactions -->
        <div class="card">
          <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Transaction History</h2>
          @if (txns().length === 0) {
            <p class="text-sm text-slate-400 text-center py-6">No transactions yet.</p>
          } @else {
            <div class="table-wrapper">
              <table class="ts-table">
                <thead><tr><th>Ref</th><th>Type</th><th>Amount</th><th>Date</th></tr></thead>
                <tbody>
                  @for (t of txns(); track t.id) {
                    <tr>
                      <td class="font-mono text-xs">{{ t.reference }}</td>
                      <td><span class="badge badge-blue">{{ t.type | titlecase }}</span></td>
                      <td class="font-semibold">{{ inr(t.amount) }}</td>
                      <td class="text-xs text-slate-400">{{ fmtDate(t.createdAt) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    }
  `
})
export class LoanDetailComponent implements OnInit {
  loan = signal<LoanResponse | null>(null);
  txns = signal<TransactionResponse[]>([]);
  loading = signal(true);
  simpleInterest = signal(0);
  capitalised = signal(0);

  summary = signal<{ label: string; value: string }[]>([]);

  constructor(private loanSvc: LoanService, private auth: AuthService, private http: HttpClient) {}

  ngOnInit() {
    const uid = this.auth.currentUser()?.id;
    if (!uid) { this.loading.set(false); return; }
    this.loanSvc.getLoansByBorrower(uid).subscribe(res => {
      const loan = res.data?.[0];
      if (!loan) { this.loading.set(false); return; }
      this.loan.set(loan);
      const si = Math.round(loan.loanAmount * (loan.interestRate / 100) * (3 / 12));
      this.simpleInterest.set(si);
      this.capitalised.set(loan.loanAmount + si);
      this.summary.set([
        { label: 'Sanctioned',      value: this.inr(loan.loanAmount) },
        { label: 'Milestone fund',  value: this.inr(loan.milestoneFund) },
        { label: 'Emergency fund',  value: this.inr(loan.emergencyFund) },
        { label: 'Interest rate',   value: `${loan.interestRate}%` },
        { label: 'Status',          value: loan.status },
      ]);
      this.http.get<ApiResponse<TransactionResponse[]>>(
        `${environment.apiUrl}/api/transactions/loan/${loan.id}`
      ).subscribe(r => { this.txns.set(r.data ?? []); this.loading.set(false); });
    });
  }

  inr(v: number) { return '₹' + (v ?? 0).toLocaleString('en-IN'); }
  fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
