import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AdminDashboardResponse } from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Header -->
    <div class="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div>
        <h1 class="page-title">Admin Dashboard</h1>
        <p class="page-subtitle">{{ greeting() }} — system overview</p>
      </div>
      <span class="text-xs text-slate-400 shrink-0">{{ today() }}</span>
    </div>

    @if (loading()) {
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        @for (i of [1,2,3,4]; track i) {
          <div class="stat-card animate-pulse">
            <div class="h-3 bg-slate-200 rounded w-16 mb-3"></div>
            <div class="h-8 bg-slate-200 rounded w-12"></div>
          </div>
        }
      </div>
    } @else {
      <!-- Stat cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="stat-card border-l-4 border-primary-500">
          <div class="flex items-start justify-between mb-2">
            <span class="stat-label">Total Users</span>
            <div class="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
              <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857
                     M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857
                     m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
          </div>
          <span class="stat-value">{{ dash()?.totalUsers ?? 0 }}</span>
          <p class="text-xs text-slate-400 mt-1">{{ activeUsers() }} active</p>
        </div>

        <div class="stat-card border-l-4 border-green-500">
          <div class="flex items-start justify-between mb-2">
            <span class="stat-label">Active Loans</span>
            <div class="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
              <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <span class="stat-value text-green-700">{{ dash()?.activeLoans ?? 0 }}</span>
          <p class="text-xs text-slate-400 mt-1">Currently running</p>
        </div>

        <div class="stat-card border-l-4 border-amber-500">
          <div class="flex items-start justify-between mb-2">
            <span class="stat-label">Managers</span>
            <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
          </div>
          <span class="stat-value text-amber-600">{{ dash()?.totalManagers ?? 0 }}</span>
          <p class="text-xs text-slate-400 mt-1">Loan officers</p>
        </div>

        <div class="stat-card border-l-4 border-red-400">
          <div class="flex items-start justify-between mb-2">
            <span class="stat-label">Inactive</span>
            <div class="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
              <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636
                     m12.728 12.728L5.636 5.636"/>
              </svg>
            </div>
          </div>
          <span class="stat-value text-red-600">{{ dash()?.inactiveUsers ?? 0 }}</span>
          <p class="text-xs text-slate-400 mt-1">Disabled accounts</p>
        </div>
      </div>

      <!-- Charts row -->
      <div class="grid lg:grid-cols-3 gap-4 mb-4">

        <!-- Donut: User Activity -->
        <div class="card flex flex-col items-center">
          <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4 self-start">
            User Activity
          </h2>
          <div class="relative w-40 h-40">
            <svg viewBox="0 0 100 100" class="w-full h-full">
              <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" stroke-width="14"/>
              <circle cx="50" cy="50" r="38" fill="none" stroke="#3b82f6"
                      stroke-width="14" stroke-linecap="round"
                      [attr.stroke-dasharray]="activeDash()"
                      transform="rotate(-90 50 50)"/>
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-2xl font-bold text-slate-900">{{ activePct() }}%</span>
              <span class="text-xs text-slate-400">active</span>
            </div>
          </div>
          <div class="flex gap-5 mt-4 text-xs text-slate-500">
            <div class="flex items-center gap-1.5">
              <div class="w-2.5 h-2.5 rounded-full bg-primary-500"></div>
              Active ({{ activeUsers() }})
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
              Inactive ({{ dash()?.inactiveUsers ?? 0 }})
            </div>
          </div>
        </div>

        <!-- Bar chart: Distribution -->
        <div class="card">
          <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-5">
            User Distribution
          </h2>
          <div class="space-y-4">
            @for (bar of bars(); track bar.label) {
              <div>
                <div class="flex justify-between text-xs mb-1.5">
                  <span class="text-slate-500">{{ bar.label }}</span>
                  <span class="font-semibold text-slate-700">{{ bar.value }}</span>
                </div>
                <div class="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-700"
                       [class]="bar.color"
                       [style.width]="bar.pct + '%'"></div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card">
          <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
            Quick Actions
          </h2>
          <div class="grid grid-cols-2 gap-2">
            @for (action of quickActions; track action.label) {
              <a [routerLink]="action.route"
                 class="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200
                        hover:border-primary-300 hover:bg-primary-50 transition-colors group">
                <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center
                            group-hover:bg-primary-100 transition-colors">
                  <span class="text-base leading-none">{{ action.icon }}</span>
                </div>
                <span class="text-xs text-slate-600 group-hover:text-primary-700 text-center leading-tight">
                  {{ action.label }}
                </span>
              </a>
            }
          </div>
        </div>
      </div>

      <!-- System health banner -->
      <div class="rounded-xl border border-primary-200 bg-gradient-to-r from-primary-50 to-blue-50 px-5 py-4
                  flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p class="text-sm font-semibold text-primary-800">System Health</p>
          <p class="text-xs text-primary-600 mt-0.5">
            {{ activePct() }}% of users are active ·
            {{ dash()?.activeLoans ?? 0 }} loans in progress ·
            {{ dash()?.totalManagers ?? 0 }} managers assigned
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span class="text-xs text-primary-700 font-medium">All systems operational</span>
        </div>
      </div>
    }
  `
})
export class AdminDashboardComponent implements OnInit {
  dash    = signal<AdminDashboardResponse | null>(null);
  loading = signal(true);

  private readonly C = 238.76; // 2 * π * 38

  activeUsers   = computed(() => (this.dash()?.totalUsers ?? 0) - (this.dash()?.inactiveUsers ?? 0));
  borrowerCount = computed(() => (this.dash()?.totalUsers ?? 0) - (this.dash()?.totalManagers ?? 0));

  activePct = computed(() => {
    const d = this.dash();
    if (!d?.totalUsers) return 0;
    return Math.round(((d.totalUsers - d.inactiveUsers) / d.totalUsers) * 100);
  });

  activeDash = computed(() => {
    const f = ((this.activePct() / 100) * this.C).toFixed(2);
    return `${f} ${this.C}`;
  });

  bars = computed(() => {
    const d = this.dash();
    const total = d?.totalUsers || 1;
    return [
      { label: 'Active Accounts',    value: this.activeUsers(),        color: 'bg-green-500',   pct: Math.round((this.activeUsers()        / total) * 100) },
      { label: 'Inactive Accounts',  value: d?.inactiveUsers ?? 0,     color: 'bg-red-400',     pct: Math.round(((d?.inactiveUsers ?? 0)   / total) * 100) },
      { label: 'Managers',           value: d?.totalManagers ?? 0,     color: 'bg-amber-500',   pct: Math.round(((d?.totalManagers ?? 0)   / total) * 100) },
      { label: 'Borrowers / Others', value: this.borrowerCount(),      color: 'bg-primary-500', pct: Math.round((this.borrowerCount()      / total) * 100) },
    ];
  });

  readonly quickActions = [
    { label: 'All Loans',      route: '/admin/loans',   icon: '📋' },
    { label: 'Manage Users',   route: '/admin/users',   icon: '👥' },
    { label: 'System Config',  route: '/admin/config',  icon: '⚙️' },
    { label: 'Audit Log',      route: '/admin/audit',   icon: '📑' },
    { label: 'Notifications',  route: '/notifications', icon: '🔔' },
  ];

  constructor(private svc: AdminService) {}

  ngOnInit() {
    this.svc.getDashboard().subscribe({
      next: res => { this.dash.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  today(): string {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
}
