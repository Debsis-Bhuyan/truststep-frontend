import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AdminDashboardResponse } from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <h1 class="page-title">Admin Dashboard</h1>
      <p class="page-subtitle">System overview: users, loans, configuration</p>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16"><span class="spinner w-8 h-8"></span></div>
    } @else {
      <!-- Stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="stat-card">
          <span class="stat-label">Users</span>
          <span class="stat-value">{{ dash()?.totalUsers ?? 0 }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Active Loans</span>
          <span class="stat-value text-primary-700">{{ dash()?.activeLoans ?? 0 }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Managers</span>
          <span class="stat-value text-amber-600">{{ dash()?.totalManagers ?? 0 }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Inactive Users</span>
          <span class="stat-value text-red-600">{{ dash()?.inactiveUsers ?? 0 }}</span>
        </div>
      </div>

      <div class="grid sm:grid-cols-2 gap-4 max-w-3xl">
        <!-- Quick config -->
        <div class="card">
          <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Quick Config</h2>
          <div class="grid grid-cols-2 gap-2">
            <a routerLink="/admin/config" class="btn-secondary text-sm justify-center">Interest rates</a>
            <a routerLink="/admin/config" class="btn-secondary text-sm justify-center">Emergency limits</a>
            <a routerLink="/admin/config" class="btn-secondary text-sm justify-center">Retention %</a>
            <a routerLink="/admin/config" class="btn-secondary text-sm justify-center">Moratorium length</a>
          </div>
        </div>

        <!-- Recent activity placeholder -->
        <div class="card">
          <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Recent Activity</h2>
          <div class="space-y-2">
            @for (i of [1,2,3]; track i) {
              <div class="h-3 bg-slate-100 rounded animate-pulse"></div>
            }
          </div>
          <a routerLink="/admin/audit" class="text-sm text-primary-600 hover:underline block mt-4">View audit log →</a>
        </div>
      </div>
    }
  `
})
export class AdminDashboardComponent implements OnInit {
  dash = signal<AdminDashboardResponse | null>(null);
  loading = signal(true);

  constructor(private svc: AdminService) {}

  ngOnInit() {
    this.svc.getDashboard().subscribe({
      next: res => { this.dash.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
