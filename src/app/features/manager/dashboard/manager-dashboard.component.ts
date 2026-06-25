import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { ManagerDashboardResponse } from '../../../core/models/loan.model';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <h1 class="page-title">Manager Dashboard</h1>
      <p class="page-subtitle">Portfolio overview and pending actions</p>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16"><span class="spinner w-8 h-8"></span></div>
    } @else if (dash()) {
      <!-- Stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="stat-card">
          <span class="stat-label">Assigned Loans</span>
          <span class="stat-value">{{ dash()!.assignedLoans }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Pending Proofs</span>
          <span class="stat-value text-amber-600">{{ dash()!.pendingProofs }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Emergency Requests</span>
          <span class="stat-value text-red-600">{{ dash()!.emergencyRequests }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Disbursed</span>
          <span class="stat-value text-primary-700">₹{{ formatL(dash()!.totalDisbursed) }}</span>
        </div>
      </div>

      <!-- Pending actions -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-slate-700 uppercase tracking-wide">Pending Your Action</h2>
          <a routerLink="/manager/loans" class="text-sm text-primary-600 hover:underline">View all loans →</a>
        </div>

        @if (dash()!.pendingActions.length === 0) {
          <p class="text-sm text-slate-400 text-center py-8">No pending actions 🎉</p>
        } @else {
          <div class="table-wrapper">
            <table class="ts-table">
              <thead><tr><th>Loan</th><th>Borrower</th><th>Item</th><th>Type</th><th></th></tr></thead>
              <tbody>
                @for (a of dash()!.pendingActions; track a.loanId) {
                  <tr>
                    <td class="font-mono text-xs">{{ a.loanNumber }}</td>
                    <td class="font-medium">{{ a.borrowerName }}</td>
                    <td>{{ a.item }}</td>
                    <td><span [class]="typeBadge(a.type)" class="badge">{{ a.type }}</span></td>
                    <td>
                      <a [routerLink]="reviewRoute(a.type, a.loanId)"
                         class="btn-primary text-xs py-1.5 px-3">Review</a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    }
  `
})
export class ManagerDashboardComponent implements OnInit {
  dash = signal<ManagerDashboardResponse | null>(null);
  loading = signal(true);

  constructor(private svc: DashboardService, private auth: AuthService) {}

  ngOnInit() {
    const id = this.auth.currentUser()?.id;
    if (!id) { this.loading.set(false); return; }
    this.svc.getManagerDashboard(id).subscribe({
      next: res => { this.dash.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  formatL(v: number) {
    if (v >= 100000) return `${(v / 100000).toFixed(1)}L`;
    return v.toLocaleString('en-IN');
  }

  typeBadge(t: string) {
    return { Milestone: 'badge-blue', Emergency: 'badge-red', Sanction: 'badge-amber' }[t] ?? 'badge-slate';
  }

  reviewRoute(type: string, loanId: number) {
    if (type === 'Milestone') return `/manager/review-proof/${loanId}`;
    if (type === 'Emergency') return `/manager/review-emergency/${loanId}`;
    return `/manager/loans/${loanId}/review`;
  }
}
