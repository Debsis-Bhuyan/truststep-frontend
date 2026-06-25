import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoanService } from '../../../core/services/loan.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoanResponse, LoanStatus } from '../../../core/models/loan.model';

@Component({
  selector: 'app-loan-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">Loans</h1>
      <p class="page-subtitle">Search and filter all assigned loans</p>
    </div>

    <!-- Search & filter -->
    <div class="card mb-4">
      <div class="flex flex-col sm:flex-row gap-3">
        <input [(ngModel)]="keyword" (ngModelChange)="search()" class="form-input flex-1"
               placeholder="Search by name / loan number…">
        <select [(ngModel)]="statusFilter" (ngModelChange)="search()" class="form-select sm:w-44">
          <option value="">Status: All</option>
          @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
        </select>
        <button class="btn-primary" (click)="search()">Filter</button>
      </div>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16"><span class="spinner w-8 h-8"></span></div>
    } @else {
      <div class="table-wrapper">
        <table class="ts-table">
          <thead><tr>
            <th>Loan #</th><th>Borrower</th><th>Amount</th><th>Disbursed</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            @for (l of loans(); track l.loanId) {
              <tr>
                <td class="font-mono text-xs">{{ l.loanNumber }}</td>
                <td class="font-medium">{{ l.borrowerName }}</td>
                <td>{{ inr(l.totalApprovedAmount) }}</td>
                <td>{{ inr(l.totalDisbursed) }}</td>
                <td><span [class]="statusBadge(l.status)" class="badge">{{ l.status }}</span></td>
                <td>
                  <a [routerLink]="'/manager/loans/' + l.loanId + '/review'" class="btn-secondary text-xs py-1.5">Open</a>
                </td>
              </tr>
            }
            @empty {
              <tr><td colspan="6" class="text-center py-10 text-slate-400">No loans found</td></tr>
            }
          </tbody>
        </table>
      </div>
    }
  `
})
export class LoanListComponent implements OnInit {
  loans = signal<LoanResponse[]>([]);
  loading = signal(true);
  keyword = '';
  statusFilter = '';
  statuses: LoanStatus[] = ['APPLIED', 'UNDER_REVIEW', 'SANCTIONED', 'ACTIVE', 'MORATORIUM', 'REPAYMENT', 'CLOSED', 'REJECTED'];
  private managerId = 0;

  constructor(private svc: LoanService, private auth: AuthService) {}

  ngOnInit() {
    this.managerId = this.auth.currentUser()?.id ?? 0;
    this.search();
  }

  search() {
    this.loading.set(true);
    this.svc.searchLoans(this.managerId, this.keyword || undefined, (this.statusFilter as LoanStatus) || undefined)
      .subscribe({
        next: res => { this.loans.set(res.data ?? []); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
  }

  inr(v: number) { return '₹' + (v ?? 0).toLocaleString('en-IN'); }
  statusBadge(s: string) {
    const m: Record<string, string> = {
      ACTIVE: 'badge-green', SANCTIONED: 'badge-blue', APPLIED: 'badge-amber',
      MORATORIUM: 'badge-purple', REPAYMENT: 'badge-blue', REJECTED: 'badge-red',
      CLOSED: 'badge-slate', UNDER_REVIEW: 'badge-amber'
    };
    return m[s] ?? 'badge-slate';
  }
}
