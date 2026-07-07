import { Component, computed, signal, inject } from '@angular/core';
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

        <!-- User footer -->
        <div class="px-4 py-4 border-t border-slate-100">
          <a routerLink="/profile"
             class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
             (click)="closeSidebar()">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700
                        flex items-center justify-center shrink-0">
              <span class="text-white font-semibold text-sm">{{ userInitial() }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-800 truncate group-hover:text-primary-700 transition-colors">
                {{ user()?.name ?? 'User' }}
              </p>
              <p class="text-xs text-slate-400 truncate">{{ user()?.email }}</p>
            </div>
            <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
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
          <div class="flex items-center gap-1">
            <!-- Notifications -->
            <a routerLink="/notifications" title="Notifications"
               class="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
            </a>
            <!-- Profile avatar (top bar) -->
            <a routerLink="/profile" title="My Profile"
               class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700
                      flex items-center justify-center hover:opacity-80 transition-opacity ml-1">
              <span class="text-white font-semibold text-sm">{{ userInitial() }}</span>
            </a>
            <!-- Sign out -->
            <button (click)="openLogoutModal()" title="Sign out"
                    class="ml-1 p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </button>
          </div>
        </header>

        <!-- Page content -->
        <main class="flex-1 overflow-y-auto">
          <div class="max-w-8xl mx-auto px-4 py-6 sm:px-6">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>

    <!-- Logout confirm modal -->
    @if (logoutModalOpen()) {
      <div class="fixed inset-0 z-[999] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" (click)="closeLogoutModal()"></div>
        <!-- Dialog -->
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
          <div class="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </div>
          <div class="text-center">
            <h3 class="text-lg font-semibold text-slate-900">Sign out?</h3>
            <p class="text-sm text-slate-500 mt-1">You will be redirected to the login page.</p>
          </div>
          <div class="flex gap-3">
            <button (click)="closeLogoutModal()"
                    class="flex-1 btn-secondary py-2.5">
              Cancel
            </button>
            <button (click)="confirmLogout()"
                    class="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-lg py-2.5 transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class MainLayoutComponent {
  sidebarOpen    = signal(false);
  logoutModalOpen = signal(false);
  user           = this.auth.currentUser;
  userInitial    = computed(() => this.auth.currentUser()?.name?.[0]?.toUpperCase() ?? 'U');

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
      // { label: 'My Profile',      route: '/profile',               icon: '👤' },
    ];
    if (r.includes('MANAGER')) return [
      { label: 'Dashboard',       route: '/manager/dashboard',    icon: '🏠' },
      { label: 'All Loans',       route: '/manager/loans',        icon: '📋' },
      { label: 'Approvals',       route: '/manager/approvals',    icon: '✅' },
      { label: 'Emergency Review',route: '/manager/review-emergency', icon: '⚡' },
      { label: 'Notifications',   route: '/notifications',         icon: '🔔' },
      // { label: 'My Profile',      route: '/profile',               icon: '👤' },
    ];
    if (r.includes('ADMIN')) return [
      { label: 'Dashboard',       route: '/admin/dashboard',      icon: '🏠' },
      { label: 'All Loans',       route: '/admin/loans',          icon: '📋' },
      { label: 'Users',           route: '/admin/users',          icon: '👥' },
      { label: 'System Config',   route: '/admin/config',         icon: '⚙️' },
      { label: 'Audit Log',       route: '/admin/audit',          icon: '📑' },
      { label: 'Notifications',   route: '/notifications',         icon: '🔔' },
      // { label: 'My Profile',      route: '/profile',               icon: '👤' },
    ];
    return [];
  });

  constructor(private auth: AuthService) {}

  toggleSidebar()   { this.sidebarOpen.update(v => !v); }
  closeSidebar()    { this.sidebarOpen.set(false); }
  openLogoutModal() { this.logoutModalOpen.set(true); }
  closeLogoutModal(){ this.logoutModalOpen.set(false); }
  confirmLogout()   { this.logoutModalOpen.set(false); this.auth.logout(); }
}
