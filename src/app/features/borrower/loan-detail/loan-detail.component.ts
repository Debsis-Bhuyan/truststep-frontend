import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LoanService } from '../../../core/services/loan.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoanResponse } from '../../../core/models/loan.model';
import { TransactionResponse } from '../../../core/models/transaction.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PageResponse } from '../../../core/models/admin.model';

@Component({
  selector: 'app-loan-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <h1 class="page-title">My Loan</h1>
      <p class="page-subtitle">Full loan view: funds, moratorium, interest, transactions</p>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16"><span class="spinner w-8 h-8"></span></div>
    } @else if (!loan()) {
      <div class="card text-center py-10">
        <p class="text-slate-500 mb-4">No loan found.</p>
        <a routerLink="/borrower/apply" class="btn-primary">Apply for a loan</a>
      </div>
    } @else {
      <div class="max-w-4xl space-y-4">
        <p class="text-sm text-slate-400">My Loan / {{ loan()!.loanNumber }}</p>

        <div class="grid sm:grid-cols-2 gap-4">
          <!-- Loan Summary -->
          <div class="card">
            <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Loan Summary</h2>
            <dl class="space-y-2.5 text-sm">
              <div class="flex justify-between"><dt class="text-slate-500">Sanctioned</dt><dd class="font-semibold text-slate-900">{{ inr(loan()!.totalApprovedAmount) }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Milestone fund</dt><dd class="font-medium">{{ inr(loan()!.milestoneFund) }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Emergency fund</dt><dd class="font-medium">{{ inr(loan()!.emergencyFund) }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Emergency used</dt><dd class="font-medium text-red-600">{{ inr(loan()!.emergencyUsed) }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Emergency balance</dt><dd class="font-semibold text-emerald-700">{{ inr(loan()!.emergencyBalance) }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Interest rate</dt><dd class="font-medium">{{ loan()!.interestRate }}%</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Tenure</dt><dd class="font-medium">{{ loan()!.tenureMonths }} months</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Status</dt>
                <dd><span [class]="statusBadge(loan()!.status)" class="badge">{{ loan()!.status }}</span></dd>
              </div>
            </dl>
          </div>

          <!-- Moratorium -->
          <div class="card">
            <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Moratorium</h2>
            <dl class="space-y-2.5 text-sm">
              <div class="flex justify-between"><dt class="text-slate-500">Period</dt><dd class="font-medium">{{ loan()!.moratoriumMonths }} months</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Moratorium rate</dt><dd class="font-medium text-amber-700">{{ loan()!.moratoriumInterestRate }}%</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Interest accrued</dt><dd class="font-semibold text-amber-700">{{ inr(loan()!.totalInterestAccrued) }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Total disbursed</dt><dd class="font-semibold text-primary-700">{{ inr(loan()!.totalDisbursed) }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Outstanding</dt><dd class="font-semibold text-red-600">{{ inr(loan()!.outstandingBalance) }}</dd></div>
            </dl>
            @if (loan()!.emiStartDate) {
              <div class="info-bar mt-4 text-xs">
                📅 EMI starts: {{ fmtDate(loan()!.emiStartDate) }}
              </div>
            }
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
                      <td class="font-mono text-xs text-slate-500">{{ t.reference }}</td>
                      <td><span class="badge badge-blue text-xs">{{ t.type }}</span></td>
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

  constructor(private loanSvc: LoanService, private auth: AuthService, private http: HttpClient) {}

  ngOnInit() {
    const uid = this.auth.currentUser()?.id;
    if (!uid) { this.loading.set(false); return; }
    this.loanSvc.getLoansByBorrower(uid).subscribe(res => {
      const loan = res.data?.[0];
      if (!loan) { this.loading.set(false); return; }
      this.loan.set(loan);
      const params = new HttpParams().set('page', 0).set('size', 20);
      this.http.get<ApiResponse<PageResponse<TransactionResponse>>>(
        `${environment.apiUrl}/api/transactions/loan/${loan.loanId}`, { params }
      ).subscribe(r => {
        this.txns.set(r.data?.content ?? []);
        this.loading.set(false);
      });
    });
  }

  inr(v: number) { return '₹' + (v ?? 0).toLocaleString('en-IN'); }
  fmtDate(d: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  statusBadge(s: string) {
    const m: Record<string, string> = {
      ACTIVE: 'badge-green', SANCTIONED: 'badge-blue', APPLIED: 'badge-amber',
      MORATORIUM: 'badge-purple', REPAYMENT: 'badge-blue', REJECTED: 'badge-red', CLOSED: 'badge-slate'
    };
    return m[s] ?? 'badge-slate';
  }
}
