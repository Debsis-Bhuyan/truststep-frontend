import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AdminUserDto } from '../../../core/models/admin.model';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-admin-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Back + header -->
    <div class="page-header">
      <button (click)="back()" class="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 mb-3 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        Back to Users
      </button>
      <h1 class="page-title">User Profile</h1>
      <p class="page-subtitle">Full profile view — admin read-only.</p>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-24"><span class="spinner w-10 h-10"></span></div>
    } @else if (!user()) {
      <div class="card text-center py-16 text-slate-400">
        <p class="text-3xl mb-3">👤</p>
        <p>User not found.</p>
        <button (click)="back()" class="btn-secondary mt-4 text-sm">Back to Users</button>
      </div>
    } @else {
      <div class="grid lg:grid-cols-3 gap-6">

        <!-- ── LEFT: identity card ─────────────────────── -->
        <div class="space-y-5">
          <!-- Avatar + name -->
          <div class="card flex flex-col items-center text-center gap-3 py-8">
            @if (user()!.profilePhoto) {
              <img [src]="user()!.profilePhoto" alt="Profile"
                   class="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md">
            } @else {
              <div class="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-700
                          flex items-center justify-center border-4 border-white shadow-md">
                <span class="text-white text-3xl font-bold">{{ initial() }}</span>
              </div>
            }
            <div>
              <h2 class="text-xl font-bold text-slate-900">{{ user()!.name }}</h2>
              <p class="text-sm text-slate-500">{{ user()!.email }}</p>
              @if (user()!.phone) {
                <p class="text-sm text-slate-400 mt-0.5">{{ user()!.phone }}</p>
              }
            </div>
            <!-- Status badges -->
            <div class="flex flex-wrap justify-center gap-2 mt-1">
              <span [class]="roleBadge(user()!.role)" class="badge">{{ fmtRole(user()!.role) }}</span>
              <span [class]="user()!.enabled ? 'badge-green' : 'badge-red'" class="badge">
                {{ user()!.enabled ? '● Active' : '● Inactive' }}
              </span>
              @if (user()!.verified) {
                <span class="badge badge-blue">✓ Verified</span>
              } @else {
                <span class="badge badge-slate">Unverified</span>
              }
            </div>
          </div>

          <!-- Quick stats -->
          <div class="card space-y-3">
            <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Account Info</h3>
            <div class="space-y-2.5 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-500">User ID</span>
                <span class="font-mono text-slate-800 font-medium">#{{ user()!.id }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Joined</span>
                <span class="text-slate-800">{{ user()!.createdAt | date:'dd MMM yyyy' }}</span>
              </div>
              @if (user()!.lastLogin) {
                <div class="flex justify-between">
                  <span class="text-slate-500">Last login</span>
                  <span class="text-slate-800">{{ user()!.lastLogin | date:'dd MMM yyyy, HH:mm' }}</span>
                </div>
              }
              @if (user()!.updatedAt) {
                <div class="flex justify-between">
                  <span class="text-slate-500">Last updated</span>
                  <span class="text-slate-800">{{ user()!.updatedAt | date:'dd MMM yyyy' }}</span>
                </div>
              }
              @if (user()!.aadhaarLast4) {
                <div class="flex justify-between">
                  <span class="text-slate-500">Aadhaar</span>
                  <span class="font-mono text-slate-800">••••&nbsp;••••&nbsp;{{ user()!.aadhaarLast4 }}</span>
                </div>
              }
              @if (user()!.dateOfBirth) {
                <div class="flex justify-between">
                  <span class="text-slate-500">Date of birth</span>
                  <span class="text-slate-800">{{ user()!.dateOfBirth | date:'dd MMM yyyy' }}</span>
                </div>
              }
              @if (user()!.gender) {
                <div class="flex justify-between">
                  <span class="text-slate-500">Gender</span>
                  <span class="text-slate-800">{{ fmtGender(user()!.gender) }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Actions -->
          <div class="card space-y-2.5">
            <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Admin Actions</h3>
            @if (user()!.enabled) {
              <button class="w-full btn-secondary text-sm" [disabled]="actioning()"
                      (click)="deactivate()">
                @if (actioning()) { <span class="spinner w-3 h-3"></span> }
                Deactivate Account
              </button>
            } @else {
              <button class="w-full btn-success text-sm" [disabled]="actioning()"
                      (click)="activate()">
                @if (actioning()) { <span class="spinner w-3 h-3"></span> }
                Activate Account
              </button>
            }
            <div>
              <label class="form-label text-xs">Change Role</label>
              <div class="flex gap-2">
                <select [(ngModel)]="selectedRole" class="form-select flex-1 text-sm"
                        [ngModel]="currentRoleName()">
                  <option value="ROLE_BORROWER">Borrower</option>
                  <option value="ROLE_MANAGER">Manager</option>
                  <option value="ROLE_ADMIN">Admin</option>
                </select>
                <button class="btn-secondary text-xs px-3" [disabled]="actioning()"
                        (click)="updateRole()">Apply</button>
              </div>
            </div>
          </div>
        </div>

        <!-- ── RIGHT: details ──────────────────────────── -->
        <div class="lg:col-span-2 space-y-5">

          <!-- Personal details -->
          <div class="card">
            <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Personal Information</h3>
            <div class="grid sm:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <p class="text-xs text-slate-400 mb-0.5">Full Name</p>
                <p class="text-sm font-medium text-slate-900">{{ user()!.name || '—' }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 mb-0.5">Email Address</p>
                <p class="text-sm font-medium text-slate-900">{{ user()!.email || '—' }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 mb-0.5">Phone Number</p>
                <p class="text-sm font-medium text-slate-900">{{ user()!.phone || '—' }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 mb-0.5">Date of Birth</p>
                <p class="text-sm font-medium text-slate-900">
                  {{ user()!.dateOfBirth ? (user()!.dateOfBirth | date:'dd MMMM yyyy') : '—' }}
                </p>
              </div>
              <div>
                <p class="text-xs text-slate-400 mb-0.5">Gender</p>
                <p class="text-sm font-medium text-slate-900">{{ fmtGender(user()!.gender) }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 mb-0.5">Aadhaar (last 4)</p>
                <p class="text-sm font-medium text-slate-900 font-mono">
                  {{ user()!.aadhaarLast4 ? ('•••• •••• ' + user()!.aadhaarLast4) : '—' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Address -->
          <div class="card">
            <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Address</h3>
            @if (hasAddress()) {
              <div class="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                <div class="sm:col-span-2">
                  <p class="text-xs text-slate-400 mb-0.5">Street Address</p>
                  <p class="text-sm font-medium text-slate-900">{{ user()!.address || '—' }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-400 mb-0.5">City</p>
                  <p class="text-sm font-medium text-slate-900">{{ user()!.city || '—' }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-400 mb-0.5">State</p>
                  <p class="text-sm font-medium text-slate-900">{{ user()!.state || '—' }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-400 mb-0.5">Pincode</p>
                  <p class="text-sm font-medium text-slate-900 font-mono">{{ user()!.pincode || '—' }}</p>
                </div>
              </div>
            } @else {
              <p class="text-sm text-slate-400 italic">No address on file.</p>
            }
          </div>

          <!-- Verification & security -->
          <div class="card">
            <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Verification & Security</h3>
            <div class="grid sm:grid-cols-3 gap-4">
              <div class="rounded-xl p-4 text-center"
                   [class]="user()!.verified ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-200'">
                <p class="text-2xl mb-1">{{ user()!.verified ? '✅' : '⏳' }}</p>
                <p class="text-xs font-medium" [class]="user()!.verified ? 'text-emerald-700' : 'text-slate-500'">
                  KYC {{ user()!.verified ? 'Verified' : 'Pending' }}
                </p>
              </div>
              <div class="rounded-xl p-4 text-center"
                   [class]="user()!.enabled ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'">
                <p class="text-2xl mb-1">{{ user()!.enabled ? '🟢' : '🔴' }}</p>
                <p class="text-xs font-medium" [class]="user()!.enabled ? 'text-emerald-700' : 'text-red-600'">
                  Account {{ user()!.enabled ? 'Active' : 'Disabled' }}
                </p>
              </div>
              <div class="rounded-xl p-4 text-center bg-blue-50 border border-blue-100">
                <p class="text-2xl mb-1">🔐</p>
                <p class="text-xs font-medium text-blue-700">JWT Auth</p>
              </div>
            </div>
          </div>

          <!-- Timeline -->
          <div class="card">
            <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Activity Timeline</h3>
            <div class="space-y-3">
              @if (user()!.lastLogin) {
                <div class="flex items-start gap-3">
                  <div class="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0"></div>
                  <div>
                    <p class="text-sm text-slate-800 font-medium">Last login</p>
                    <p class="text-xs text-slate-400">{{ user()!.lastLogin | date:'dd MMM yyyy, HH:mm' }}</p>
                  </div>
                </div>
              }
              @if (user()!.updatedAt) {
                <div class="flex items-start gap-3">
                  <div class="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
                  <div>
                    <p class="text-sm text-slate-800 font-medium">Profile last updated</p>
                    <p class="text-xs text-slate-400">{{ user()!.updatedAt | date:'dd MMM yyyy, HH:mm' }}</p>
                  </div>
                </div>
              }
              <div class="flex items-start gap-3">
                <div class="w-2 h-2 rounded-full bg-slate-300 mt-1.5 shrink-0"></div>
                <div>
                  <p class="text-sm text-slate-800 font-medium">Account created</p>
                  <p class="text-xs text-slate-400">{{ user()!.createdAt | date:'dd MMM yyyy, HH:mm' }}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    }
  `
})
export class AdminUserProfileComponent implements OnInit {
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private svc     = inject(AdminService);
  private toast   = inject(ToastService);

  user      = signal<AdminUserDto | null>(null);
  loading   = signal(true);
  actioning = signal(false);
  selectedRole = '';

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.svc.getUserById(id).subscribe({
      next: res => {
        this.user.set(res.data);
        this.selectedRole = res.data?.role ?? '';
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Could not load user profile.');
        this.loading.set(false);
      }
    });
  }

  back() { this.router.navigate(['/admin/users']); }

  initial() { return (this.user()?.name?.[0] ?? '?').toUpperCase(); }

  currentRoleName() { return this.user()?.role ?? ''; }

  hasAddress() {
    const u = this.user();
    return u && (u.address || u.city || u.state || u.pincode);
  }

  deactivate() {
    const u = this.user()!;
    this.actioning.set(true);
    this.svc.deactivateUser(u.id).subscribe({
      next: () => { this.user.update(x => x ? { ...x, enabled: false } : x); this.actioning.set(false); this.toast.success(`${u.name} deactivated.`); },
      error: () => { this.actioning.set(false); this.toast.error('Deactivation failed.'); }
    });
  }

  activate() {
    const u = this.user()!;
    this.actioning.set(true);
    this.svc.activateUser(u.id).subscribe({
      next: () => { this.user.update(x => x ? { ...x, enabled: true } : x); this.actioning.set(false); this.toast.success(`${u.name} activated.`); },
      error: () => { this.actioning.set(false); this.toast.error('Activation failed.'); }
    });
  }

  updateRole() {
    if (!this.selectedRole) return;
    const u = this.user()!;
    this.actioning.set(true);
    this.svc.updateUserRole(u.id, this.selectedRole).subscribe({
      next: () => { this.user.update(x => x ? { ...x, role: this.selectedRole } : x); this.actioning.set(false); this.toast.success('Role updated successfully.'); },
      error: () => { this.actioning.set(false); this.toast.error('Role update failed.'); }
    });
  }

  roleBadge(role: string) {
    if (role?.includes('ADMIN'))   return 'badge badge-purple';
    if (role?.includes('MANAGER')) return 'badge badge-amber';
    return 'badge badge-blue';
  }

  fmtRole(role: string) { return role?.replace('ROLE_', '') ?? '—'; }

  fmtGender(g: string | null) {
    if (!g) return '—';
    return { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other', PREFER_NOT_TO_SAY: 'Prefer not to say' }[g] ?? g;
  }
}
