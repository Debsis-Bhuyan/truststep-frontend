import { Component, OnInit, signal, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AdminUserDto, UserManagementResponse } from '../../../core/models/admin.model';
import { ToastService } from '../../../shared/toast/toast.service';

interface UserRow {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  active: boolean;
  verified?: boolean;
  createdAt?: string;
  profilePhoto?: string;
}

type SortField = 'userId' | 'email' | 'fullName';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .kebab-menu { position: relative; display: inline-block; }
    .kebab-dropdown {
      position: absolute; right: 0; top: calc(100% + 4px); z-index: 50;
      min-width: 180px; background: white; border: 1px solid #e2e8f0;
      border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.12);
      overflow: hidden;
    }
    .kdrop-item {
      display: flex; align-items: center; gap: 8px; width: 100%;
      padding: 8px 14px; font-size: 13px; text-align: left; background: none;
      border: none; cursor: pointer; color: #334155; transition: background .12s;
      white-space: nowrap;
    }
    .kdrop-item:hover { background: #f1f5f9; }
    .kdrop-item.danger:hover { background: #fef2f2; color: #dc2626; }
    .kdrop-item.success-item:hover { background: #f0fdf4; color: #16a34a; }
    .kdrop-item.active-role { background: #eff6ff; color: #2563eb; font-weight: 600; }
    .kdrop-item:disabled { opacity: .45; cursor: not-allowed; pointer-events: none; }
    .kdrop-divider { border: none; border-top: 1px solid #e2e8f0; margin: 2px 0; }
    .kdrop-label {
      padding: 5px 14px 3px; font-size: 10px; font-weight: 600;
      letter-spacing: .05em; text-transform: uppercase; color: #94a3b8;
    }
    .kebab-btn {
      width: 30px; height: 30px; border-radius: 6px; border: 1px solid transparent;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; line-height: 1; color: #64748b; cursor: pointer;
      background: none; transition: background .12s, border-color .12s;
    }
    .kebab-btn:hover { background: #f1f5f9; border-color: #cbd5e1; }
    .kebab-btn.open { background: #e2e8f0; border-color: #cbd5e1; }
  `],
  template: `
    <!-- Header -->
    <div class="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div>
        <h1 class="page-title">User Management</h1>
        <p class="page-subtitle">
          @if (searchMode()) {
            Showing <strong>{{ rows().length }}</strong> search results
          } @else {
            Page {{ page + 1 }} of {{ totalPages }} &nbsp;·&nbsp; {{ totalElements }} total users
          }
        </p>
      </div>
      @if (!searchMode()) {
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-xs text-slate-400">Sort by</span>
          <select [(ngModel)]="sortBy" (ngModelChange)="reload()" class="form-select text-xs py-1.5 w-36">
            <option value="userId">ID</option>
            <option value="fullName">Name</option>
            <option value="email">Email</option>
          </select>
          <button (click)="toggleSort()" class="btn-secondary text-xs py-1.5 px-3" title="Toggle direction">
            {{ sortDir === 'asc' ? '↑ Asc' : '↓ Desc' }}
          </button>
        </div>
      }
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
          <input [(ngModel)]="keyword" (ngModelChange)="onFilterChange()"
                 class="form-input pl-9" placeholder="Search name or email…">
        </div>
        <select [(ngModel)]="roleFilter" (ngModelChange)="onFilterChange()" class="form-select sm:w-40">
          <option value="">All Roles</option>
          <option value="BORROWER">Borrower</option>
          <option value="MANAGER">Manager</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select [(ngModel)]="activeFilter" (ngModelChange)="onFilterChange()" class="form-select sm:w-40">
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        @if (searchMode()) {
          <button (click)="clearFilters()" class="btn-secondary text-sm shrink-0">✕ Clear</button>
        }
      </div>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-20"><span class="spinner w-8 h-8"></span></div>
    } @else {

      <!-- Desktop table -->
      <div class="hidden md:block table-wrapper">
        <table class="ts-table">
          <thead><tr>
            <th>User</th>
            @if (!searchMode()) { <th>Phone</th> }
            <th>Role</th>
            <th>Status</th>
            @if (!searchMode()) { <th>Verified</th><th>Joined</th> }
            <th class="text-right pr-4">Actions</th>
          </tr></thead>
          <tbody>
            @for (u of rows(); track u.id) {
              <tr class="cursor-pointer" (click)="view(u)">
                <!-- User -->
                <td>
                  <div class="flex items-center gap-3">
                    @if (u.profilePhoto) {
                      <img [src]="u.profilePhoto" class="w-8 h-8 rounded-full object-cover shrink-0" alt="">
                    } @else {
                      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700
                                  flex items-center justify-center shrink-0">
                        <span class="text-white text-xs font-bold">{{ initial(u.name) }}</span>
                      </div>
                    }
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-slate-900 truncate">{{ u.name }}</p>
                      <p class="text-xs text-slate-400 truncate">{{ u.email }}</p>
                    </div>
                  </div>
                </td>
                @if (!searchMode()) {
                  <td class="text-slate-500 text-sm">{{ u.phone || '—' }}</td>
                }
                <td>
                  <span [class]="roleBadge(u.role)" class="badge">{{ fmtRole(u.role) }}</span>
                </td>
                <td>
                  <span [class]="u.active ? 'badge-green' : 'badge-red'" class="badge">
                    {{ u.active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                @if (!searchMode()) {
                  <td>
                    <span [class]="u.verified ? 'badge-blue' : 'badge-slate'" class="badge">
                      {{ u.verified ? '✓ KYC' : 'Pending' }}
                    </span>
                  </td>
                  <td class="text-slate-400 text-xs">{{ u.createdAt | date:'dd MMM yyyy' }}</td>
                }
                <!-- Actions: kebab menu -->
                <td class="text-right pr-3" (click)="$event.stopPropagation()">
                  <div class="kebab-menu">
                    <button class="kebab-btn" [class.open]="openMenuId() === u.id"
                            (click)="toggleMenu(u.id, $event)" title="Actions">
                      &#8942;
                    </button>
                    @if (openMenuId() === u.id) {
                      <div class="kebab-dropdown" (click)="$event.stopPropagation()">
                        <!-- View -->
                        <button class="kdrop-item" (click)="menuView(u)">
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                                 -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                          View Profile
                        </button>

                        <hr class="kdrop-divider">

                        <!-- Activate / Deactivate -->
                        @if (u.active) {
                          <button class="kdrop-item danger" [disabled]="actioning() === u.id"
                                  (click)="menuDeactivate(u)">
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636
                                   m12.728 12.728L5.636 5.636"/>
                            </svg>
                            {{ actioning() === u.id ? 'Deactivating…' : 'Deactivate' }}
                          </button>
                        } @else {
                          <button class="kdrop-item success-item" [disabled]="actioning() === u.id"
                                  (click)="menuActivate(u)">
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            {{ actioning() === u.id ? 'Activating…' : 'Activate' }}
                          </button>
                        }

                        <hr class="kdrop-divider">

                        <!-- Role change -->
                        <p class="kdrop-label">Change Role</p>
                        @for (r of roles; track r.value) {
                          <button class="kdrop-item" [class.active-role]="u.role === r.value"
                                  [disabled]="u.role === r.value || actioning() === u.id"
                                  (click)="menuChangeRole(u, r.value)">
                            <span style="width:14px;text-align:center">
                              {{ u.role === r.value ? '✓' : '' }}
                            </span>
                            {{ r.label }}
                          </button>
                        }
                      </div>
                    }
                  </div>
                </td>
              </tr>
            }
            @empty {
              <tr>
                <td [attr.colspan]="searchMode() ? 4 : 7" class="text-center py-14 text-slate-400">
                  <p class="text-2xl mb-2">🔍</p>
                  <p>{{ searchMode() ? 'No users match your search.' : 'No users found.' }}</p>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Mobile cards -->
      <div class="md:hidden space-y-3">
        @for (u of rows(); track u.id) {
          <div class="card cursor-pointer hover:border-primary-300 transition-colors" (click)="view(u)">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700
                          flex items-center justify-center shrink-0">
                <span class="text-white text-sm font-bold">{{ initial(u.name) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <p class="text-sm font-semibold text-slate-900">{{ u.name }}</p>
                  <span [class]="roleBadge(u.role)" class="badge text-xs">{{ fmtRole(u.role) }}</span>
                  <span [class]="u.active ? 'badge-green' : 'badge-red'" class="badge text-xs">
                    {{ u.active ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <p class="text-xs text-slate-500">{{ u.email }}</p>
              </div>
              <!-- Mobile kebab -->
              <div class="kebab-menu" (click)="$event.stopPropagation()">
                <button class="kebab-btn" [class.open]="openMenuId() === u.id"
                        (click)="toggleMenu(u.id, $event)">&#8942;</button>
                @if (openMenuId() === u.id) {
                  <div class="kebab-dropdown" (click)="$event.stopPropagation()">
                    <button class="kdrop-item" (click)="menuView(u)">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                             -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                      View Profile
                    </button>
                    <hr class="kdrop-divider">
                    @if (u.active) {
                      <button class="kdrop-item danger" [disabled]="actioning() === u.id"
                              (click)="menuDeactivate(u)">
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636
                               m12.728 12.728L5.636 5.636"/>
                        </svg>
                        {{ actioning() === u.id ? 'Deactivating…' : 'Deactivate' }}
                      </button>
                    } @else {
                      <button class="kdrop-item success-item" [disabled]="actioning() === u.id"
                              (click)="menuActivate(u)">
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        {{ actioning() === u.id ? 'Activating…' : 'Activate' }}
                      </button>
                    }
                    <hr class="kdrop-divider">
                    <p class="kdrop-label">Change Role</p>
                    @for (r of roles; track r.value) {
                      <button class="kdrop-item" [class.active-role]="u.role === r.value"
                              [disabled]="u.role === r.value || actioning() === u.id"
                              (click)="menuChangeRole(u, r.value)">
                        <span style="width:14px;text-align:center">{{ u.role === r.value ? '✓' : '' }}</span>
                        {{ r.label }}
                      </button>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        }
        @empty {
          <div class="text-center py-14 text-slate-400">
            <p class="text-2xl mb-2">🔍</p>No users found
          </div>
        }
      </div>

      <!-- Pagination -->
      @if (!searchMode()) {
        <div class="flex items-center justify-between mt-5 text-sm text-slate-500">
          <span>Page {{ page + 1 }} of {{ totalPages }}</span>
          <div class="flex gap-2">
            <button class="btn-secondary text-xs py-1.5 px-3"
                    [disabled]="page === 0" (click)="prevPage()">← Prev</button>
            <button class="btn-secondary text-xs py-1.5 px-3"
                    [disabled]="page >= totalPages - 1" (click)="nextPage()">Next →</button>
          </div>
        </div>
      } @else {
        <p class="mt-4 text-xs text-slate-400 text-center">
          Server-side search — showing all matching users across all pages.
        </p>
      }
    }
  `
})
export class UserManagementComponent implements OnInit {
  private svc    = inject(AdminService);
  private router = inject(Router);
  private toast  = inject(ToastService);

  rows       = signal<UserRow[]>([]);
  loading    = signal(true);
  actioning  = signal<number | null>(null);
  searchMode = signal(false);
  openMenuId = signal<number | null>(null);

  readonly roles = [
    { value: 'ROLE_BORROWER', label: 'Borrower' },
    { value: 'ROLE_MANAGER',  label: 'Manager'  },
    { value: 'ROLE_ADMIN',    label: 'Admin'     },
  ];

  keyword      = '';
  roleFilter   = '';
  activeFilter = '';

  page          = 0;
  totalPages    = 1;
  totalElements = 0;
  sortBy: SortField = 'userId';
  sortDir: 'asc' | 'desc' = 'asc';

  private debounce: any;

  @HostListener('document:click')
  closeMenu() { this.openMenuId.set(null); }

  ngOnInit() { this.loadPaginated(); }
  prevPage()  { this.page--; this.loadPaginated(); }
  nextPage()  { this.page++; this.loadPaginated(); }
  reload()    { this.page = 0; this.loadPaginated(); }

  toggleSort() {
    this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    this.reload();
  }

  toggleMenu(id: number, event: Event) {
    event.stopPropagation();
    this.openMenuId.set(this.openMenuId() === id ? null : id);
  }

  onFilterChange() {
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => {
      const hasFilter = !!(this.keyword.trim() || this.roleFilter || this.activeFilter);
      if (hasFilter) {
        this.runSearch();
      } else {
        this.page = 0;
        this.searchMode.set(false);
        this.loadPaginated();
      }
    }, 350);
  }

  clearFilters() {
    this.keyword = '';
    this.roleFilter = '';
    this.activeFilter = '';
    this.page = 0;
    this.searchMode.set(false);
    this.loadPaginated();
  }

  // ── Menu actions ────────────────────────────────────────────────────────────

  menuView(u: UserRow) {
    this.openMenuId.set(null);
    this.view(u);
  }

  menuDeactivate(u: UserRow) {
    this.openMenuId.set(null);
    this.deactivate(u);
  }

  menuActivate(u: UserRow) {
    this.openMenuId.set(null);
    this.activate(u);
  }

  menuChangeRole(u: UserRow, roleName: string) {
    this.openMenuId.set(null);
    if (roleName === u.role) return;
    this.actioning.set(u.id);
    this.svc.updateUserRole(u.id, roleName).subscribe({
      next: () => {
        this.rows.update(l => l.map(x => x.id === u.id ? { ...x, role: roleName } : x));
        this.actioning.set(null);
        this.toast.success(`${u.name}'s role updated to ${this.fmtRole(roleName)}.`);
      },
      error: () => {
        this.actioning.set(null);
        this.toast.error('Role update failed.');
      }
    });
  }

  // ── Data actions ─────────────────────────────────────────────────────────────

  view(u: UserRow) { this.router.navigate(['/admin/users', u.id]); }

  deactivate(u: UserRow) {
    this.actioning.set(u.id);
    this.svc.deactivateUser(u.id).subscribe({
      next: () => {
        this.rows.update(l => l.map(x => x.id === u.id ? { ...x, active: false } : x));
        this.actioning.set(null);
        this.toast.success(`${u.name} deactivated.`);
      },
      error: () => { this.actioning.set(null); this.toast.error('Deactivation failed.'); }
    });
  }

  activate(u: UserRow) {
    this.actioning.set(u.id);
    this.svc.activateUser(u.id).subscribe({
      next: () => {
        this.rows.update(l => l.map(x => x.id === u.id ? { ...x, active: true } : x));
        this.actioning.set(null);
        this.toast.success(`${u.name} activated.`);
      },
      error: () => { this.actioning.set(null); this.toast.error('Activation failed.'); }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private loadPaginated() {
    this.loading.set(true);
    this.svc.getUsers(this.page, 10, this.sortBy, this.sortDir).subscribe({
      next: res => {
        this.rows.set((res.data?.content ?? []).map(this.fromAdminDto));
        this.totalPages    = res.data?.totalPages    ?? 1;
        this.totalElements = res.data?.totalElements ?? 0;
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private runSearch() {
    this.loading.set(true);
    this.searchMode.set(true);
    const active = this.activeFilter === 'true' ? true
                 : this.activeFilter === 'false' ? false
                 : undefined;
    this.svc.searchUsers(
      this.keyword.trim() || undefined,
      this.roleFilter || undefined,
      active
    ).subscribe({
      next: res => {
        this.rows.set((res.data ?? []).map(this.fromSearchResult));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private fromAdminDto = (u: AdminUserDto): UserRow => ({
    id: u.id, name: u.name, email: u.email, phone: u.phone,
    role: u.role, active: u.enabled, verified: u.verified,
    createdAt: u.createdAt, profilePhoto: u.profilePhoto ?? undefined
  });

  private fromSearchResult = (u: UserManagementResponse): UserRow => ({
    id: u.id, name: u.fullName, email: u.email, role: u.role, active: u.active
  });

  initial(name: string)  { return (name?.[0] ?? '?').toUpperCase(); }
  fmtRole(role: string)  { return role?.replace('ROLE_', '') ?? '—'; }

  roleBadge(role: string) {
    if (role?.includes('ADMIN'))   return 'badge badge-purple';
    if (role?.includes('MANAGER')) return 'badge badge-amber';
    return 'badge badge-blue';
  }
}
