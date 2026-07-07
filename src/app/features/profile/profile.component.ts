import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { UserProfileResponse, GenderType } from '../../core/models/auth.model';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">My Profile</h1>
      <p class="page-subtitle">View and update your personal information</p>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16"><span class="spinner w-8 h-8"></span></div>
    } @else if (profile()) {
      <div class="max-w-8xl space-y-5">

        <!-- ── Profile card (top) ─────────────────────────── -->
        <div class="card">
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">

            <!-- Avatar -->
            <div class="relative">
              @if (profile()!.profilePhoto) {
                <img [src]="profile()!.profilePhoto" alt="Profile photo"
                     class="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md">
              } @else {
                <div class="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-700
                            flex items-center justify-center shadow-md border-4 border-white">
                  <span class="text-white text-2xl font-bold">{{ initials() }}</span>
                </div>
              }
              <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white"
                   [class]="profile()!.active ? 'bg-emerald-500' : 'bg-slate-400'"
                   title="{{ profile()!.active ? 'Active' : 'Inactive' }}">
              </div>
            </div>

            <!-- Basic info -->
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <h2 class="text-xl font-bold text-slate-900">{{ profile()!.fullName }}</h2>
                <span [class]="roleBadge(profile()!.role)" class="badge text-xs">{{ fmtRole(profile()!.role) }}</span>
                @if (profile()!.verified) {
                  <span class="badge badge-green text-xs">✓ Verified</span>
                }
              </div>
              <p class="text-slate-500 text-sm">{{ profile()!.email }}</p>
              @if (profile()!.phone) {
                <p class="text-slate-400 text-sm">{{ profile()!.phone }}</p>
              }
              @if (profile()!.lastLogin) {
                <p class="text-xs text-slate-400 mt-1">Last login: {{ fmtDate(profile()!.lastLogin) }}</p>
              }
            </div>

            <!-- Status pills -->
            <div class="flex flex-wrap gap-2 shrink-0">
              <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                   [class]="profile()!.kycComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'">
                {{ profile()!.kycComplete ? '✅ KYC complete' : '⚠️ KYC pending' }}
              </div>
              @if (profile()!.aadhaarLast4) {
                <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 text-xs font-medium">
                  🔒 Aadhaar ****{{ profile()!.aadhaarLast4 }}
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 border-b border-slate-200">
          @for (tab of tabs; track tab.id) {
            <button (click)="activeTab.set(tab.id)"
                    class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px"
                    [class]="activeTab() === tab.id
                      ? 'border-primary-600 text-primary-700'
                      : 'border-transparent text-slate-500 hover:text-slate-700'">
              {{ tab.icon }} {{ tab.label }}
            </button>
          }
        </div>

        <!-- ── TAB: Personal Info ──────────────────────────── -->
        @if (activeTab() === 'info') {
          <div class="card">
            <h3 class="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-5">Personal Information</h3>

            @if (infoSuccess()) {
              <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4 text-emerald-700 text-sm">
                ✅ Profile updated successfully!
              </div>
            }
            @if (infoError()) { <div class="warning-bar mb-4">⚠️ {{ infoError() }}</div> }

            <form [formGroup]="infoForm" (ngSubmit)="saveInfo()" class="space-y-5">
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Full name</label>
                  <input formControlName="fullName" class="form-input" placeholder="Ramesh Kumar">
                  @if (fi['fullName'].invalid && fi['fullName'].touched) {
                    <p class="form-error">Minimum 2 characters</p>
                  }
                </div>
                <div>
                  <label class="form-label">Phone</label>
                  <input formControlName="phone" class="form-input" placeholder="9XXXXXXXXX" maxlength="10">
                  @if (fi['phone'].invalid && fi['phone'].touched) {
                    <p class="form-error">Valid 10-digit Indian mobile number required</p>
                  }
                </div>
              </div>

              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Date of birth</label>
                  <input formControlName="dateOfBirth" type="date" class="form-input">
                </div>
                <div>
                  <label class="form-label">Gender</label>
                  <select formControlName="gender" class="form-select">
                    <option value="">Select…</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="form-label">Profile photo URL</label>
                <input formControlName="profilePhoto" class="form-input"
                       placeholder="https://example.com/your-photo.jpg">
                <p class="text-xs text-slate-400 mt-1">Paste a public image URL for your profile picture</p>
              </div>

              <div class="border-t border-slate-100 pt-5">
                <h4 class="text-sm font-semibold text-slate-600 mb-4">Address</h4>
                <div class="space-y-3">
                  <div>
                    <label class="form-label">Street address</label>
                    <textarea formControlName="address" class="form-input min-h-[72px] resize-none"
                              placeholder="House / flat no., street, locality…"></textarea>
                  </div>
                  <div class="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label class="form-label">City</label>
                      <input formControlName="city" class="form-input" placeholder="Guwahati">
                    </div>
                    <div>
                      <label class="form-label">State</label>
                      <select formControlName="state" class="form-select">
                        <option value="">Select state…</option>
                        @for (s of indianStates; track s) {
                          <option [value]="s">{{ s }}</option>
                        }
                      </select>
                    </div>
                    <div>
                      <label class="form-label">Pincode</label>
                      <input formControlName="pincode" class="form-input" placeholder="781001" maxlength="6">
                      @if (fi['pincode'].invalid && fi['pincode'].touched) {
                        <p class="form-error">6-digit pincode</p>
                      }
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex justify-end pt-2">
                <button type="submit" [disabled]="savingInfo()" class="btn-primary px-8">
                  @if (savingInfo()) { <span class="spinner w-4 h-4"></span> }
                  Save changes
                </button>
              </div>
            </form>
          </div>
        }

        <!-- ── TAB: Account Details ────────────────────────── -->
        @if (activeTab() === 'account') {
          <div class="card">
            <h3 class="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-5">Account Details</h3>
            <dl class="divide-y divide-slate-100">
              @for (row of accountRows(); track row.label) {
                <div class="flex items-center justify-between py-3.5">
                  <dt class="text-sm text-slate-500">{{ row.label }}</dt>
                  <dd class="flex items-center gap-2">
                    @if (row.badge) {
                      <span [class]="row.badge" class="badge">{{ row.value }}</span>
                    } @else {
                      <span class="text-sm font-medium text-slate-800">{{ row.value }}</span>
                    }
                  </dd>
                </div>
              }
            </dl>
          </div>

          <!-- KYC status -->
          <div class="card"
               [class]="profile()!.kycComplete ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'">
            <div class="flex items-center gap-3">
              <div class="text-3xl">{{ profile()!.kycComplete ? '✅' : '⚠️' }}</div>
              <div>
                <p class="font-semibold"
                   [class]="profile()!.kycComplete ? 'text-emerald-800' : 'text-amber-800'">
                  KYC {{ profile()!.kycComplete ? 'Complete' : 'Pending' }}
                </p>
                <p class="text-sm mt-0.5"
                   [class]="profile()!.kycComplete ? 'text-emerald-600' : 'text-amber-600'">
                  @if (profile()!.kycComplete) {
                    PAN and Aadhaar are verified and securely stored.
                    @if (profile()!.aadhaarLast4) {
                      Aadhaar ending ****{{ profile()!.aadhaarLast4 }}.
                    }
                  } @else {
                    Complete KYC verification to access all loan features.
                  }
                </p>
              </div>
            </div>
          </div>
        }

        <!-- ── TAB: Change Password ────────────────────────── -->
        @if (activeTab() === 'password') {
          <div class="card max-w-lg">
            <h3 class="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-5">Change Password</h3>

            @if (pwdSuccess()) {
              <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4 text-emerald-700 text-sm">
                ✅ Password changed. Please use your new password next time you sign in.
              </div>
            }
            @if (pwdError()) { <div class="warning-bar mb-4">⚠️ {{ pwdError() }}</div> }

            <form [formGroup]="pwdForm" (ngSubmit)="savePassword()" class="space-y-4">
              <div>
                <label class="form-label">Current password</label>
                <div class="relative">
                  <input formControlName="currentPassword"
                         [type]="showOld() ? 'text' : 'password'"
                         class="form-input pr-10" placeholder="••••••••">
                  <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          (click)="toggleOld()">
                    {{ showOld() ? '🙈' : '👁️' }}
                  </button>
                </div>
                @if (fp['currentPassword'].invalid && fp['currentPassword'].touched) {
                  <p class="form-error">Current password required</p>
                }
              </div>

              <div>
                <label class="form-label">New password</label>
                <div class="relative">
                  <input formControlName="newPassword"
                         [type]="showNew() ? 'text' : 'password'"
                         class="form-input pr-10" placeholder="Min 8 characters">
                  <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          (click)="toggleNew()">
                    {{ showNew() ? '🙈' : '👁️' }}
                  </button>
                </div>
                @if (fp['newPassword'].invalid && fp['newPassword'].touched) {
                  <p class="form-error">Minimum 8 characters</p>
                }
              </div>

              <div>
                <label class="form-label">Confirm new password</label>
                <input formControlName="confirmPassword" type="password" class="form-input" placeholder="Repeat new password">
                @if (pwdForm.errors?.['mismatch'] && fp['confirmPassword'].touched) {
                  <p class="form-error">Passwords do not match</p>
                }
              </div>

              <!-- Strength indicator -->
              @if (fp['newPassword'].value) {
                <div>
                  <div class="flex gap-1 mb-1">
                    @for (i of [1,2,3,4]; track i) {
                      <div class="h-1.5 flex-1 rounded-full transition-colors"
                           [class]="i <= pwdStrength() ? strengthColor() : 'bg-slate-200'"></div>
                    }
                  </div>
                  <p class="text-xs" [class]="strengthTextColor()">{{ strengthLabel() }}</p>
                </div>
              }

              <div class="info-bar text-xs">
                🔒 Old sessions are signed out after a successful password change.
              </div>

              <button type="submit" [disabled]="savingPwd()" class="btn-primary w-full">
                @if (savingPwd()) { <span class="spinner w-4 h-4"></span> }
                Update password
              </button>
            </form>
          </div>
        }

      </div>
    }
  `
})
export class ProfileComponent implements OnInit {
  private toast = inject(ToastService);
  profile    = signal<UserProfileResponse | null>(null);
  loading    = signal(true);
  activeTab  = signal<'info' | 'account' | 'password'>('info');

  infoError   = signal('');
  infoSuccess = signal(false);
  savingInfo  = signal(false);

  pwdError   = signal('');
  pwdSuccess = signal(false);
  savingPwd  = signal(false);

  showOld = signal(false);
  showNew = signal(false);

  infoForm!: FormGroup;
  pwdForm!: FormGroup;

  get fi() { return this.infoForm.controls; }
  get fp() { return this.pwdForm.controls; }

  tabs = [
    { id: 'info'     as const, label: 'Personal Info',  icon: '👤' },
    { id: 'account'  as const, label: 'Account',         icon: '🔐' },
    { id: 'password' as const, label: 'Change Password', icon: '🔑' },
  ];

  initials = computed(() => {
    const name = this.profile()?.fullName ?? this.auth.currentUser()?.name ?? '';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  });

  accountRows = computed(() => {
    const p = this.profile();
    if (!p) return [];
    return [
      // { label: 'User ID',     value: `#${p.userId}`,        badge: '' },
      { label: 'Email',       value: p.email,                badge: '' },
      { label: 'Role',        value: this.fmtRole(p.role),   badge: this.roleBadge(p.role) },
      { label: 'Account',     value: p.active ? 'Active' : 'Inactive', badge: p.active ? 'badge-green' : 'badge-slate' },
      { label: 'Verified',    value: p.verified ? 'Yes' : 'No',        badge: p.verified ? 'badge-green' : 'badge-amber' },
      { label: 'KYC',         value: p.kycComplete ? 'Complete' : 'Pending', badge: p.kycComplete ? 'badge-green' : 'badge-amber' },
      { label: 'Last login',  value: p.lastLogin ? this.fmtDate(p.lastLogin) : 'N/A', badge: '' },
    ];
  });

  pwdStrength = computed(() => {
    const v = this.fp['newPassword']?.value ?? '';
    let s = 0;
    if (v.length >= 8)             s++;
    if (/[A-Z]/.test(v))          s++;
    if (/[0-9]/.test(v))          s++;
    if (/[^A-Za-z0-9]/.test(v))   s++;
    return s;
  });
  strengthColor     = computed(() => ['bg-red-500','bg-red-500','bg-amber-400','bg-amber-400','bg-emerald-500'][this.pwdStrength()]);
  strengthTextColor = computed(() => ['text-red-600','text-red-600','text-amber-600','text-amber-600','text-emerald-600'][this.pwdStrength()]);
  strengthLabel     = computed(() => ['Too weak','Weak','Fair','Good','Strong'][this.pwdStrength()]);

  indianStates = [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
    'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
    'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
    'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
    'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
    'Delhi','Jammu & Kashmir','Ladakh','Puducherry','Chandigarh'
  ].sort();

  constructor(private auth: AuthService, private fb: FormBuilder) {}

  ngOnInit() {
    this.infoForm = this.fb.group({
      fullName:    ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
      phone:       ['', [Validators.pattern(/^[6-9]\d{9}$/)]],
      dateOfBirth: [''],
      gender:      [''],
      profilePhoto:[''],
      address:     ['', [Validators.maxLength(500)]],
      city:        ['', [Validators.maxLength(100)]],
      state:       [''],
      pincode:     ['', [Validators.pattern(/^\d{6}$/)]]
    });

    this.pwdForm = this.fb.group({
      currentPassword:     ['', Validators.required],
      newPassword:     ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatch });

    this.loadProfile();
  }

  loadProfile() {
    this.loading.set(true);
    this.auth.getProfile().subscribe({
      next: res => {
        this.profile.set(res.data);
        this.patchInfoForm(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  patchInfoForm(p: UserProfileResponse) {
    this.infoForm.patchValue({
      fullName:     p.fullName    ?? '',
      phone:        p.phone       ?? '',
      dateOfBirth:  p.dateOfBirth ?? '',
      gender:       p.gender      ?? '',
      profilePhoto: p.profilePhoto?? '',
      address:      p.address     ?? '',
      city:         p.city        ?? '',
      state:        p.state       ?? '',
      pincode:      p.pincode     ?? ''
    });
  }

  saveInfo() {
    if (this.infoForm.invalid) { this.infoForm.markAllAsTouched(); return; }
    this.savingInfo.set(true); this.infoError.set(''); this.infoSuccess.set(false);
    const v = this.infoForm.value;
    const req = {
      fullName:     v.fullName     || undefined,
      phone:        v.phone        || undefined,
      dateOfBirth:  v.dateOfBirth  || undefined,
      gender:       (v.gender as GenderType) || undefined,
      profilePhoto: v.profilePhoto || undefined,
      address:      v.address      || undefined,
      city:         v.city         || undefined,
      state:        v.state        || undefined,
      pincode:      v.pincode      || undefined,
    };
    this.auth.updateProfile(req).subscribe({
      next: res => {
        this.profile.set(res.data);
        this.infoSuccess.set(true);
        this.savingInfo.set(false);
        this.toast.success('Profile updated successfully!');
        setTimeout(() => this.infoSuccess.set(false), 4000);
      },
      error: e => {
        this.infoError.set(e.error?.message ?? 'Update failed');
        this.toast.error(e.error?.message ?? 'Profile update failed');
        this.savingInfo.set(false);
      }
    });
  }

  savePassword() {
    if (this.pwdForm.invalid) { this.pwdForm.markAllAsTouched(); return; }
    this.savingPwd.set(true); this.pwdError.set(''); this.pwdSuccess.set(false);
    this.auth.changePassword(this.pwdForm.value).subscribe({
      next: () => {
        this.pwdSuccess.set(true);
        this.pwdForm.reset();
        this.savingPwd.set(false);
        this.toast.success('Password changed successfully!');
      },
      error: e => {
        this.pwdError.set(e.error?.message ?? 'Password change failed');
        this.toast.error(e.error?.message ?? 'Password change failed');
        this.savingPwd.set(false);
      }
    });
  }

  toggleOld() { this.showOld.update(v => !v); }
  toggleNew() { this.showNew.update(v => !v); }

  passwordMatch(g: AbstractControl) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value ? null : { mismatch: true };
  }

  roleBadge(role: string) {
    if (!role) return 'badge-slate';
    if (role.includes('ADMIN'))   return 'badge-purple';
    if (role.includes('MANAGER')) return 'badge-amber';
    return 'badge-blue';
  }

  fmtRole(role: string) {
    if (!role) return '';
    return role.replace('ROLE_', '').replace(/_/g, ' ')
               .toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  fmtDate(d: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
