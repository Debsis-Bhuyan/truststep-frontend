import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { UserManagementResponse } from '../../../core/models/admin.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">User Management</h1>
      <p class="page-subtitle">View, search, filter, activate/deactivate users. Deactivation is a soft delete — records kept for audit.</p>
    </div>

    <!-- Filters -->
    <div class="card mb-4">
      <div class="flex flex-col sm:flex-row gap-3">
        <input [(ngModel)]="search" (ngModelChange)="load()" class="form-input flex-1" placeholder="Search name / email…">
        <select [(ngModel)]="roleFilter" (ngModelChange)="load()" class="form-select sm:w-36">
          <option value="">Role: All</option>
          <option value="BORROWER">Borrower</option>
          <option value="MANAGER">Manager</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select [(ngModel)]="statusFilter" (ngModelChange)="load()" class="form-select sm:w-36">
          <option value="">Status: All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16"><span class="spinner w-8 h-8"></span></div>
    } @else {
      <div class="table-wrapper">
        <table class="ts-table">
          <thead><tr>
            <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            @for (u of filtered(); track u.id) {
              <tr>
                <td class="font-medium">{{ u.name }}</td>
                <td class="text-slate-500">{{ u.email }}</td>
                <td><span class="badge badge-blue">{{ u.role }}</span></td>
                <td>
                  <span [class]="u.isActive ? 'badge-green' : 'badge-slate'" class="badge">
                    {{ u.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    @if (u.isActive) {
                      <button class="btn-secondary text-xs py-1.5" [disabled]="actioning() === u.id"
                              (click)="deactivate(u)">Deactivate</button>
                    } @else {
                      <button class="btn-success text-xs py-1.5" [disabled]="actioning() === u.id"
                              (click)="activate(u)">Activate</button>
                    }
                    @if (u.isActive) {
                      <button class="btn-ghost text-xs py-1.5" [disabled]="actioning() === u.id"
                              (click)="resetPwd(u)">Reset pwd</button>
                    }
                  </div>
                </td>
              </tr>
            }
            @empty {
              <tr><td colspan="5" class="text-center py-10 text-slate-400">No users found</td></tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-4 text-sm text-slate-500">
        <span>Page {{ page + 1 }} of {{ totalPages }}</span>
        <div class="flex gap-2">
          <button class="btn-secondary text-xs py-1.5" [disabled]="page === 0" (click)="prevPage()">Previous</button>
          <button class="btn-secondary text-xs py-1.5" [disabled]="page >= totalPages - 1" (click)="nextPage()">Next</button>
        </div>
      </div>
    }
  `
})
export class UserManagementComponent implements OnInit {
  users = signal<UserManagementResponse[]>([]);
  filtered = signal<UserManagementResponse[]>([]);
  loading = signal(true);
  actioning = signal<number | null>(null);
  search = '';
  roleFilter = '';
  statusFilter = '';
  page = 0;
  totalPages = 1;

  constructor(private svc: AdminService) {}

  ngOnInit() { this.load(); }
  prevPage() { this.page--; this.load(); }
  nextPage() { this.page++; this.load(); }

  load() {
    this.loading.set(true);
    const active = this.statusFilter === 'true' ? true : this.statusFilter === 'false' ? false : undefined;
    this.svc.getUsers(this.page, 20, this.roleFilter || undefined, active).subscribe({
      next: res => {
        let list = res.data?.content?? [];
        if (this.search) {
          const q = this.search.toLowerCase();
          list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
        }
        this.users.set(res.data?.content ?? []);
        this.filtered.set(list);
        this.totalPages = res.data?.totalPages ?? 1;
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  deactivate(u: UserManagementResponse) {
    this.actioning.set(u.id);
    this.svc.deactivateUser(u.id).subscribe({
      next: () => { this.filtered.update(l => l.map(x => x.id === u.id ? { ...x, isActive: false } : x)); this.actioning.set(null); },
      error: () => this.actioning.set(null)
    });
  }

  activate(u: UserManagementResponse) {
    this.actioning.set(u.id);
    this.svc.activateUser(u.id).subscribe({
      next: () => { this.filtered.update(l => l.map(x => x.id === u.id ? { ...x, isActive: true } : x)); this.actioning.set(null); },
      error: () => this.actioning.set(null)
    });
  }

  resetPwd(u: UserManagementResponse) {
    this.actioning.set(u.id);
    this.svc.resetUserPassword(u.id).subscribe({ next: () => this.actioning.set(null), error: () => this.actioning.set(null) });
  }
}
