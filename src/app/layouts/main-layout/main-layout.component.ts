import { Component, computed, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

interface NavItem { label: string; route: string; icon: string; }

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="flex h-screen overflow-hidden bg-slate-50">
      <!-- Sidebar -->
      <aside [class]="sidebarOpen() ? 'translate-x-0' : '-translate-x-full'"
             class="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0">
        <!-- Logo -->
        <div class="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
          <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">TS</span>
          </div>
          <div>
            <span class="font-bold text-slate-900">TrustStep</span>
            <p class="text-xs text-slate-400">{{ roleLabel() }}</p>
          </div>
        </div>

        <!-- Nav -->
        <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          @for (item of navItems(); track item.route) {
            <a [routerLink]="item.route" routerLinkActive="nav-item-active"
               [routerLinkActiveOptions]="{exact: item.route.endsWith('dashboard')}"
               class="nav-item" (click)="closeSidebar()">
              <span class="text-lg leading-none">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>

        <!-- User -->
        <div class="px-4 py-4 border-t border-slate-100">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span class="text-primary-700 font-semibold text-sm">{{ userInitial() }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-800 truncate">{{ user()?.name ?? 'User' }}</p>
              <p class="text-xs text-slate-400 truncate">{{ user()?.email }}</p>
            </div>
          </div>
          <button (click)="logout()" class="w-full btn-secondary text-xs py-2">
            Sign out
          </button>
        </div>
      </aside>

      <!-- Overlay -->
      @if (sidebarOpen()) {
        <div class="fixed inset-0 z-40 bg-black/30 lg:hidden" (click)="closeSidebar()"></div>
      }

      <!-- Main -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Top bar -->
        <header class="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
          <button class="lg:hidden p-2 rounded-lg hover:bg-slate-100" (click)="toggleSidebar()">
            <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <div class="hidden lg:block"></div>
          <div class="flex items-center gap-2">
            <a routerLink="/notifications"
               class="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
            </a>
          </div>
        </header>

        <!-- Page content -->
        <main class="flex-1 overflow-y-auto">
          <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>
  `
})
export class MainLayoutComponent {
  sidebarOpen = signal(false);
  user = this.auth.currentUser;
  userInitial = computed(() => this.auth.currentUser()?.name?.[0]?.toUpperCase() ?? 'U');

  roleLabel = computed(() => {
    const r = this.auth.getRole() ?? '';
    if (r.includes('BORROWER')) return 'Borrower Portal';
    if (r.includes('MANAGER')) return 'Manager Portal';
    if (r.includes('ADMIN')) return 'Admin Portal';
    return '';
  });

  navItems = computed((): NavItem[] => {
    const r = this.auth.getRole() ?? '';
    if (r.includes('BORROWER')) return [
      { label: 'Dashboard',       route: '/borrower/dashboard',   icon: '🏠' },
      { label: 'My Loan',         route: '/borrower/loan',        icon: '📋' },
      { label: 'Apply for Loan',  route: '/borrower/apply',       icon: '✏️' },
      { label: 'Milestones',      route: '/borrower/milestones',  icon: '🎯' },
      { label: 'Emergency Fund',  route: '/borrower/emergency',   icon: '⚡' },
      { label: 'Repayment',       route: '/borrower/repayment',   icon: '💳' },
      { label: 'Notifications',   route: '/notifications',         icon: '🔔' },
    ];
    if (r.includes('MANAGER')) return [
      { label: 'Dashboard',       route: '/manager/dashboard',    icon: '🏠' },
      { label: 'All Loans',       route: '/manager/loans',        icon: '📋' },
      { label: 'Approvals',       route: '/manager/approvals',    icon: '✅' },
      { label: 'Notifications',   route: '/notifications',         icon: '🔔' },
    ];
    if (r.includes('ADMIN')) return [
      { label: 'Dashboard',       route: '/admin/dashboard',      icon: '🏠' },
      { label: 'Users',           route: '/admin/users',          icon: '👥' },
      { label: 'System Config',   route: '/admin/config',         icon: '⚙️' },
      { label: 'Audit Log',       route: '/admin/audit',          icon: '📑' },
      { label: 'Notifications',   route: '/notifications',         icon: '🔔' },
    ];
    return [];
  });

  constructor(private auth: AuthService) {}

  toggleSidebar() { this.sidebarOpen.update(v => !v); }
  closeSidebar()  { this.sidebarOpen.set(false); }
  logout()        { this.auth.logout(); }
}
