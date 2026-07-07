import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { LoanService } from '../../../core/services/loan.service';
import { AdminService } from '../../../core/services/admin.service';
import { LoanResponse, LoanStatus } from '../../../core/models/loan.model';

@Component({
  selector: 'app-all-loans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div>
        <h1 class="page-title">All Loans</h1>
        <p class="page-subtitle">Every loan in the system · who reviewed and approved each one</p>
      </div>
      <span class="text-xs text-slate-400 shrink-0">{{ totalElements }} total</span>
    </div>

    <!-- Filters -->
    <div class="card mb-5">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
          </svg>
          <input [(ngModel)]="keyword" (ngModelChange)="applyKeyword()" class="form-input pl-9"
                 placeholder="Search by loan # or borrower name…">
        </div>
        <select [(ngModel)]="managerFilter" (ngModelChange)="onManagerChange()" class="form-select sm:w-52">
          <option value="">Manager: All</option>
          @for (m of managers(); track m.id) { <option [value]="m.id">{{ m.name }}</option> }
        </select>
        <select [(ngModel)]="statusFilter" (ngModelChange)="onStatusChange()" class="form-select sm:w-48">
          <option value="">Status: All</option>
          @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
        </select>
        @if (keyword || managerFilter || statusFilter) {
          <button class="btn-secondary text-sm shrink-0" (click)="clearFilters()">✕ Clear</button>
        }
      </div>
      @if (searchMode()) {
        <p class="text-xs text-slate-400 mt-2">
          @if (managerFilter) {
            Search results for <span class="font-medium text-slate-600">{{ managerName() }}</span>
          } @else {
            Search results across all managers
          }
          via <code class="text-[11px]">/api/loans/search</code>
        </p>
      }
    </div>

    @if (loading()) {
      <div class="flex justify-center py-20"><span class="spinner w-8 h-8"></span></div>
    } @else {

      <!-- Desktop table -->
      <div class="hidden md:block table-wrapper">
        <table class="ts-table">
          <thead><tr>
            <th>Loan #</th><th>Borrower</th><th>Approved By</th><th>Amount</th>
            <th>Disbursed</th><th>Outstanding</th><th>Status</th><th>Sanctioned</th><th></th>
          </tr></thead>
          <tbody>
            @for (l of displayed(); track l.loanId) {
              <tr class="cursor-pointer" (click)="view(l)">
                <td class="font-mono text-xs">{{ l.loanNumber }}</td>
                <td class="font-medium">{{ l.borrowerName }}</td>
                <td>
                  @if (isApproved(l.status)) {
                    <span class="text-slate-700">{{ l.managerName || '—' }}</span>
                  } @else {
                    <span class="text-slate-400 text-xs italic">Pending review</span>
                  }
                </td>
                <td>{{ inr(l.totalApprovedAmount) }}</td>
                <td>{{ inr(l.totalDisbursed) }}</td>
                <td>{{ inr(l.outstandingBalance) }}</td>
                <td><span [class]="statusBadge(l.status)" class="badge">{{ l.status }}</span></td>
                <td class="text-xs text-slate-400">{{ l.sanctionDate ? (l.sanctionDate | date:'dd MMM yyyy') : '—' }}</td>
                <td class="text-right pr-3" (click)="$event.stopPropagation()">
                  <button class="btn-secondary text-xs py-1.5" (click)="view(l)">Details</button>
                </td>
              </tr>
            }
            @empty {
              <tr><td colspan="9" class="text-center py-14 text-slate-400">
                <p class="text-2xl mb-2">📋</p>No loans found
              </td></tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Mobile cards -->
      <div class="md:hidden space-y-3">
        @for (l of displayed(); track l.loanId) {
          <div class="card cursor-pointer hover:border-primary-300 transition-colors" (click)="view(l)">
            <div class="flex items-start justify-between gap-2 mb-2">
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-900 truncate">{{ l.borrowerName }}</p>
                <p class="text-xs font-mono text-slate-400">{{ l.loanNumber }}</p>
              </div>
              <span [class]="statusBadge(l.status)" class="badge shrink-0">{{ l.status }}</span>
            </div>
            <div class="grid grid-cols-2 gap-y-1.5 text-xs mb-2">
              <span class="text-slate-400">Amount</span>
              <span class="text-right font-medium text-slate-700">{{ inr(l.totalApprovedAmount) }}</span>
              <span class="text-slate-400">Disbursed</span>
              <span class="text-right font-medium text-slate-700">{{ inr(l.totalDisbursed) }}</span>
              <span class="text-slate-400">Approved By</span>
              <span class="text-right font-medium text-slate-700">
                {{ isApproved(l.status) ? (l.managerName || '—') : 'Pending' }}
              </span>
            </div>
            <button class="btn-secondary text-xs py-1.5 w-full" (click)="$event.stopPropagation(); view(l)">
              View Complete Details
            </button>
          </div>
        }
        @empty {
          <div class="text-center py-14 text-slate-400">
            <p class="text-2xl mb-2">📋</p>No loans found
          </div>
        }
      </div>

      <!-- Pagination -->
      @if (!searchMode()) {
        <div class="flex items-center justify-between mt-5 text-sm text-slate-500">
          <span>Page {{ page + 1 }} of {{ totalPages }}</span>
          <div class="flex gap-2">
            <button class="btn-secondary text-xs py-1.5 px-3" [disabled]="page === 0" (click)="prevPage()">← Prev</button>
            <button class="btn-secondary text-xs py-1.5 px-3" [disabled]="page >= totalPages - 1" (click)="nextPage()">Next →</button>
          </div>
        </div>
      } @else {
        <p class="mt-4 text-xs text-slate-400 text-center">
          {{ totalElements }} matching loan{{ totalElements === 1 ? '' : 's' }}
          {{ managerFilter ? ('for ' + managerName()) : 'across all managers' }}.
        </p>
      }
    }

    <!-- Detail modal -->
    @if (selected(); as l) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="close()">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <div class="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-xl">
            <div>
              <h2 class="text-lg font-bold text-slate-900">{{ l.loanNumber }}</h2>
              <p class="text-xs text-slate-400">{{ l.borrowerName }} · {{ l.loanType }}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span [class]="statusBadge(l.status)" class="badge">{{ l.status }}</span>
              <button class="text-slate-400 hover:text-slate-700 text-xl leading-none" (click)="close()">&times;</button>
            </div>
          </div>

          <div class="p-5 space-y-5">
            <!-- Approval -->
            <div class="rounded-lg bg-slate-50 border border-slate-100 p-4">
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Approval</p>
              @if (isApproved(l.status)) {
                <p class="text-sm text-slate-700">
                  Approved by <span class="font-semibold">{{ l.managerName || '—' }}</span>
                  on {{ l.sanctionDate ? (l.sanctionDate | date:'dd MMM yyyy') : '—' }}
                </p>
              } @else if (l.status === 'REJECTED') {
                <p class="text-sm text-slate-700">
                  Reviewed and rejected by <span class="font-semibold">{{ l.managerName || '—' }}</span>
                </p>
              } @else {
                <p class="text-sm text-slate-500">
                  Assigned to <span class="font-semibold">{{ l.managerName || '—' }}</span> · awaiting review
                </p>
              }
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div><p class="text-xs text-slate-400">Approved Amount</p><p class="text-sm font-semibold text-slate-800">{{ inr(l.totalApprovedAmount) }}</p></div>
              <div><p class="text-xs text-slate-400">Milestone Fund</p><p class="text-sm font-semibold text-slate-800">{{ inr(l.milestoneFund) }}</p></div>
              <div><p class="text-xs text-slate-400">Emergency Fund</p><p class="text-sm font-semibold text-slate-800">{{ inr(l.emergencyFund) }}</p></div>
              <div><p class="text-xs text-slate-400">Emergency Used</p><p class="text-sm font-semibold text-slate-800">{{ inr(l.emergencyUsed) }}</p></div>
              <div><p class="text-xs text-slate-400">Emergency Balance</p><p class="text-sm font-semibold text-slate-800">{{ inr(l.emergencyBalance) }}</p></div>
              <div><p class="text-xs text-slate-400">Total Disbursed</p><p class="text-sm font-semibold text-slate-800">{{ inr(l.totalDisbursed) }}</p></div>
              <div><p class="text-xs text-slate-400">Total Repaid</p><p class="text-sm font-semibold text-slate-800">{{ inr(l.totalRepaid) }}</p></div>
              <div><p class="text-xs text-slate-400">Outstanding</p><p class="text-sm font-semibold text-slate-800">{{ inr(l.outstandingBalance) }}</p></div>
              <div><p class="text-xs text-slate-400">Interest Rate</p><p class="text-sm font-semibold text-slate-800">{{ l.interestRate ?? '—' }}%</p></div>
              <div><p class="text-xs text-slate-400">Interest Type</p><p class="text-sm font-semibold text-slate-800">{{ l.interestType || '—' }}</p></div>
              <div><p class="text-xs text-slate-400">Tenure</p><p class="text-sm font-semibold text-slate-800">{{ l.tenureMonths ?? '—' }} months</p></div>
              <div><p class="text-xs text-slate-400">Moratorium</p><p class="text-sm font-semibold text-slate-800">{{ l.moratoriumMonths ?? '—' }} months</p></div>
              <div><p class="text-xs text-slate-400">Retention %</p><p class="text-sm font-semibold text-slate-800">{{ l.retentionPercentage ?? '—' }}%</p></div>
              <div><p class="text-xs text-slate-400">Retention Amount</p><p class="text-sm font-semibold text-slate-800">{{ inr(l.retentionAmount) }}</p></div>
              <div><p class="text-xs text-slate-400">Retention Released</p><p class="text-sm font-semibold text-slate-800">{{ l.retentionReleased ? 'Yes' : 'No' }}</p></div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
              <div><p class="text-xs text-slate-400">Start Date</p><p class="text-sm text-slate-700">{{ l.startDate ? (l.startDate | date:'dd MMM yyyy') : '—' }}</p></div>
              <div><p class="text-xs text-slate-400">EMI Start</p><p class="text-sm text-slate-700">{{ l.emiStartDate ? (l.emiStartDate | date:'dd MMM yyyy') : '—' }}</p></div>
              <div><p class="text-xs text-slate-400">Expected End</p><p class="text-sm text-slate-700">{{ l.expectedEndDate ? (l.expectedEndDate | date:'dd MMM yyyy') : '—' }}</p></div>
              <div><p class="text-xs text-slate-400">Actual End</p><p class="text-sm text-slate-700">{{ l.actualEndDate ? (l.actualEndDate | date:'dd MMM yyyy') : '—' }}</p></div>
              <div><p class="text-xs text-slate-400">Created</p><p class="text-sm text-slate-700">{{ l.createdAt ? (l.createdAt | date:'dd MMM yyyy, HH:mm') : '—' }}</p></div>
              <div><p class="text-xs text-slate-400">Last Updated</p><p class="text-sm text-slate-700">{{ l.updatedAt ? (l.updatedAt | date:'dd MMM yyyy, HH:mm') : '—' }}</p></div>
            </div>

            @if (l.purpose) {
              <div class="pt-3 border-t border-slate-100">
                <p class="text-xs text-slate-400 mb-1">Purpose</p>
                <p class="text-sm text-slate-700">{{ l.purpose }}</p>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class AllLoansComponent implements OnInit {
  private svc      = inject(LoanService);
  private adminSvc = inject(AdminService);

  loans      = signal<LoanResponse[]>([]);
  displayed  = signal<LoanResponse[]>([]);
  loading    = signal(true);
  managers   = signal<{ id: number; name: string }[]>([]);
  selected   = signal<LoanResponse | null>(null);

  keyword = '';
  statusFilter = '';
  managerFilter = '';
  statuses: LoanStatus[] = ['APPLIED', 'UNDER_REVIEW', 'SANCTIONED', 'ACTIVE', 'MORATORIUM', 'REPAYMENT', 'CLOSED', 'REJECTED'];

  page = 0;
  totalPages = 1;
  totalElements = 0;

  private debounce: any;
  /** Guards against the spurious ngModelChange some browsers fire on a <select> when its
   *  *ngFor options list is populated asynchronously (managers load after initial render). */
  private ready = false;

  ngOnInit() {
    this.loadManagers();
    this.load();
    setTimeout(() => { this.ready = true; });
  }

  prevPage() { this.page--; this.load(); }
  nextPage() { this.page++; this.load(); }

  /** True while a search is active (single-manager or global keyword search) — no pagination in this mode. */
  searchMode(): boolean {
    return !!this.managerFilter || !!this.keyword.trim();
  }

  onStatusChange() {
    if (!this.ready) return;
    this.page = 0;
    this.runQuery();
  }

  onManagerChange() {
    if (!this.ready) return;
    this.page = 0;
    this.runQuery();
  }

  applyKeyword() {
    if (!this.ready) return;
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => {
      this.page = 0;
      this.runQuery();
    }, 400);
  }

  clearFilters() {
    this.keyword = '';
    this.statusFilter = '';
    this.managerFilter = '';
    this.page = 0;
    this.load();
  }

  private runQuery() {
    if (this.managerFilter) this.search();
    else if (this.keyword.trim()) this.globalSearch();
    else this.load();
  }

  /** Get-all: paginated GET /api/loans (or /api/loans/status/{status}) — no keyword typed. */
  load() {
    this.loading.set(true);
    const req$ = this.statusFilter
      ? this.svc.getLoansByStatus(this.statusFilter as LoanStatus, this.page, 10)
      : this.svc.getAllLoans(this.page, 10);

    req$.subscribe({
      next: res => {
        const results = res.data?.content ?? [];
        this.loans.set(results);
        this.displayed.set(results);
        this.totalPages    = res.data?.totalPages ?? 1;
        this.totalElements = res.data?.totalElements ?? 0;
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  /** Search: real GET /api/loans/search scoped to the selected manager. */
  search() {
    this.loading.set(true);
    this.svc.searchLoans(
      Number(this.managerFilter),
      this.keyword.trim() || undefined,
      (this.statusFilter as LoanStatus) || undefined
    ).subscribe({
      next: res => this.setSearchResults(res.data ?? []),
      error: () => this.loading.set(false)
    });
  }

  /**
   * Search: no manager picked, but a keyword was typed. The backend's /api/loans/search
   * always scopes by managerId, so we fan the same search out across every manager and
   * merge the results — this is still real server-side search output, just aggregated.
   */
  globalSearch() {
    this.loading.set(true);
    const mgrs = this.managers();
    if (!mgrs.length) { this.setSearchResults([]); return; }

    const calls = mgrs.map(m => this.svc.searchLoans(
      m.id,
      this.keyword.trim() || undefined,
      (this.statusFilter as LoanStatus) || undefined
    ));

    forkJoin(calls).subscribe({
      next: resArr => this.setSearchResults(resArr.flatMap(r => r.data ?? [])),
      error: () => this.loading.set(false)
    });
  }

  private setSearchResults(results: LoanResponse[]) {
    this.loans.set(results);
    this.displayed.set(results);
    this.totalElements = results.length;
    this.loading.set(false);
  }

  private loadManagers() {
    this.adminSvc.searchUsers(undefined, 'MANAGER', true).subscribe({
      next: res => this.managers.set((res.data ?? []).map(m => ({ id: m.id, name: m.name })))
    });
  }

  managerName(): string {
    return this.managers().find(m => m.id === Number(this.managerFilter))?.name ?? '';
  }

  view(l: LoanResponse) { this.selected.set(l); }
  close() { this.selected.set(null); }

  isApproved(status: LoanStatus) {
    return status === 'SANCTIONED' || status === 'ACTIVE' || status === 'MORATORIUM' ||
           status === 'REPAYMENT' || status === 'CLOSED';
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
