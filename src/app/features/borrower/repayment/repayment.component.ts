import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmiService } from '../../../core/services/emi.service';
import { LoanService } from '../../../core/services/loan.service';
import { AuthService } from '../../../core/services/auth.service';
import { EmiScheduleResponse } from '../../../core/models/emi.model';
import { LoanResponse } from '../../../core/models/loan.model';

@Component({
  selector: 'app-repayment',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">Repayment Schedule</h1>
      <p class="page-subtitle">Reducing-balance EMI · pay EMI · see penalties</p>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16"><span class="spinner w-8 h-8"></span></div>
    } @else if (!loan()) {
      <div class="card text-center py-10 text-slate-500">No active loan in repayment phase.</div>
    } @else {
      <div class="max-w-4xl">
        <div class="card mb-4">
          <p class="text-sm text-slate-500">
            Computed on capitalised principal
            <span class="font-semibold text-slate-800">{{ inr(capitalised()) }}</span>
            · reducing balance
          </p>
        </div>

        <div class="table-wrapper">
          <table class="ts-table">
            <thead><tr>
              <th>EMI</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Principal</th>
              <th>Interest</th>
              @if (hasPenalty()) { <th>Penalty</th> }
              <th>Status</th>
              <th></th>
            </tr></thead>
            <tbody>
              @for (e of emis(); track e.id) {
                <tr>
                  <td class="font-medium">{{ e.emiNumber }}</td>
                  <td>{{ fmtDate(e.dueDate) }}</td>
                  <td class="font-semibold">{{ inr(e.emiAmount) }}</td>
                  <td>{{ inr(e.principal) }}</td>
                  <td>{{ inr(e.interest) }}</td>
                  @if (hasPenalty()) { <td class="text-red-600">{{ e.penalty > 0 ? inr(e.penalty) : '—' }}</td> }
                  <td>
                    <span [class]="statusBadge(e.status)" class="badge">{{ e.status | titlecase }}</span>
                  </td>
                  <td>
                    @if (e.status === 'DUE' || e.status === 'OVERDUE') {
                      <button class="btn-primary text-xs py-1.5 px-3" [disabled]="paying() === e.id"
                              (click)="pay(e)">
                        @if (paying() === e.id) { <span class="spinner w-3 h-3"></span> }
                        Pay
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="info-bar mt-4">
          ℹ️ Late payment adds a 2% penalty on the overdue EMI.
        </div>
      </div>
    }
  `
})
export class RepaymentComponent implements OnInit {
  loan = signal<LoanResponse | null>(null);
  emis = signal<EmiScheduleResponse[]>([]);
  loading = signal(true);
  paying = signal<number | null>(null);

  capitalised = signal(0);
  hasPenalty = signal(false);

  constructor(private emiSvc: EmiService, private loanSvc: LoanService, private auth: AuthService) {}

  ngOnInit() {
    const uid = this.auth.currentUser()?.id;
    if (!uid) { this.loading.set(false); return; }
    this.loanSvc.getLoansByBorrower(uid).subscribe(res => {
      const loan = res.data?.find((l: LoanResponse) => ['REPAYMENT', 'ACTIVE'].includes(l.status));
      if (!loan) { this.loading.set(false); return; }
      this.loan.set(loan);
      this.emiSvc.getScheduleByLoan(loan.id).subscribe(r => {
        const list = r.data ?? [];
        this.emis.set(list);
        this.capitalised.set(list[0] ? list.reduce((s: number, e: EmiScheduleResponse) => s + e.principal + e.interest, 0) : 0);
        this.hasPenalty.set(list.some((e: EmiScheduleResponse) => e.penalty > 0));
        this.loading.set(false);
      });
    });
  }

  pay(emi: EmiScheduleResponse) {
    this.paying.set(emi.id);
    this.emiSvc.payEmi(emi.id).subscribe({
      next: res => {
        this.emis.update(list => list.map(e => e.id === emi.id ? res.data : e));
        this.paying.set(null);
      },
      error: () => this.paying.set(null)
    });
  }

  inr(v: number) { return '₹' + (v ?? 0).toLocaleString('en-IN'); }

  fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  statusBadge(s: string) {
    return { PAID: 'badge-green', DUE: 'badge-amber', UPCOMING: 'badge-slate', OVERDUE: 'badge-red' }[s] ?? 'badge-slate';
  }
}
