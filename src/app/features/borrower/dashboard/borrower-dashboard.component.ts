import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { BorrowerDashboardResponse } from '../../../core/models/loan.model';

@Component({
  selector: 'app-borrower-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Welcome back, {{ user()?.name }}</p>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16"><span class="spinner w-8 h-8"></span></div>
    } @else if (!dash()) {
      <div class="card text-center py-12">
        <div class="text-5xl mb-4">📋</div>
        <p class="text-slate-500 mb-4">No active loan found.</p>
        <a routerLink="/borrower/apply" class="btn-primary">Apply for a loan</a>
      </div>
    } @else {
      <!-- Stat cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="stat-card">
          <span class="stat-label">Sanctioned</span>
          <span class="stat-value">{{ inr(dash()!.sanctionedAmount) }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Disbursed</span>
          <span class="stat-value text-primary-700">{{ inr(dash()!.disbursedAmount) }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Emergency Left</span>
          <span class="stat-value text-emerald-700">{{ inr(dash()!.emergencyLeft) }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Status</span>
          <span [class]="statusBadge(dash()!.loanStatus)" class="badge mt-1 self-start">
            {{ dash()!.loanStatus }}
          </span>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-4">
        <!-- Milestone progress -->
        <div class="card">
          <h2 class="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Milestone Progress</h2>
          @if (dash()!.milestones.length === 0) {
            <p class="text-sm text-slate-400 text-center py-4">No milestones defined yet.</p>
          }
          <div class="space-y-3">
            @for (m of dash()!.milestones; track m.milestoneId) {
              <div class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <p class="text-sm font-medium text-slate-800">M{{ m.phaseNumber }} · {{ m.description }}</p>
                  <p class="text-xs text-slate-400">{{ inr(m.allocatedAmount) }}</p>
                </div>
                <span [class]="milestoneBadge(m.status)" class="badge">{{ fmtStatus(m.status) }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Next steps -->
        <div class="card">
          <h2 class="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Next Steps</h2>
          @if (dash()!.nextStep) {
            <p class="text-sm text-slate-600 mb-4">{{ dash()!.nextStep }}</p>
          }
          <div class="space-y-2">
            <a routerLink="/borrower/milestones" class="btn-primary w-full text-center block">
              Submit milestone proof
            </a>
            <a routerLink="/borrower/emergency" class="btn-secondary w-full text-center block">
              Access emergency fund
            </a>
            <a routerLink="/borrower/loan" class="btn-ghost w-full text-center block text-sm">
              View loan details
            </a>
          </div>
        </div>
      </div>
    }
  `
})
export class BorrowerDashboardComponent implements OnInit {
  dash    = signal<BorrowerDashboardResponse | null>(null);
  loading = signal(true);
  user    = this.auth.currentUser;

  constructor(private svc: DashboardService, private auth: AuthService) {}

  ngOnInit() {
    const id = this.auth.currentUser()?.id;
    if (!id) { this.loading.set(false); return; }
    this.svc.getBorrowerDashboard(id).subscribe({
      next: res => { this.dash.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  inr(v: number): string { return '₹' + (v ?? 0).toLocaleString('en-IN'); }

  fmtStatus(s: string) {
    return s?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) ?? s;
  }

  statusBadge(s: string) {
    const m: Record<string, string> = {
      MORATORIUM: 'badge-purple', ACTIVE: 'badge-green',
      REPAYMENT: 'badge-blue', SANCTIONED: 'badge-amber',
      APPLIED: 'badge-slate', UNDER_REVIEW: 'badge-amber', CLOSED: 'badge-slate'
    };
    return m[s] ?? 'badge-slate';
  }

  milestoneBadge(s: string) {
    const m: Record<string, string> = {
      COMPLETED: 'badge-green', IN_PROGRESS: 'badge-blue',
      APPROVED: 'badge-green', PENDING: 'badge-slate',
      PROOF_SUBMITTED: 'badge-amber', REJECTED: 'badge-red',
      PARTIALLY_APPROVED: 'badge-amber'
    };
    return m[s] ?? 'badge-slate';
  }
}
