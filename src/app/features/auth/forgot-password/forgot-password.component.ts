import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <h2 class="text-xl font-bold text-slate-900 mb-1">Reset password</h2>
    <p class="text-sm text-slate-500 mb-6">We'll send you a reset link</p>

    @if (success()) {
      <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4 text-emerald-700 text-sm">
        ✅ Reset token generated. Check your email or use the token below to set a new password.
        @if (resetToken()) {
          <div class="mt-2 font-mono bg-white rounded p-2 text-xs break-all border border-emerald-200">
            {{ resetToken() }}
          </div>
        }
      </div>
    }

    @if (!resetToken()) {
      <!-- Step 1: Request link -->
      <form [formGroup]="emailForm" (ngSubmit)="sendLink()" class="space-y-4">
        <div>
          <label class="form-label">Registered email</label>
          <input formControlName="email" type="email" class="form-input" placeholder="you@example.com">
          @if (emailForm.get('email')?.invalid && emailForm.get('email')?.touched) {
            <p class="form-error">Valid email required</p>
          }
        </div>
        <button type="submit" [disabled]="loading()" class="btn-primary w-full">
          @if (loading()) { <span class="spinner w-4 h-4"></span> }
          Send reset link
        </button>
      </form>
    } @else {
      <!-- Step 2: Set new password -->
      <form [formGroup]="resetForm" (ngSubmit)="updatePassword()" class="space-y-4">
        <div>
          <label class="form-label">New password</label>
          <input formControlName="newPassword" type="password" class="form-input" placeholder="••••••••">
          @if (resetForm.get('newPassword')?.invalid && resetForm.get('newPassword')?.touched) {
            <p class="form-error">Min 8 characters</p>
          }
        </div>
        <div>
          <label class="form-label">Confirm new password</label>
          <input formControlName="confirmPassword" type="password" class="form-input" placeholder="••••••••">
        </div>
        <div class="info-bar text-xs">
          🔒 Old sessions are signed out after a successful reset.
        </div>
        <button type="submit" [disabled]="loading()" class="btn-primary w-full">
          @if (loading()) { <span class="spinner w-4 h-4"></span> }
          Update password
        </button>
      </form>
    }

    @if (error()) { <div class="warning-bar mt-4">⚠️ {{ error() }}</div> }

    <p class="text-sm text-slate-500 text-center mt-5">
      <a routerLink="/login" class="text-primary-600 hover:underline">← Back to sign in</a>
    </p>
  `
})
export class ForgotPasswordComponent {
  emailForm: FormGroup;
  resetForm: FormGroup;
  loading = signal(false);
  error = signal('');
  success = signal(false);
  resetToken = signal('');

  constructor(private fb: FormBuilder, private auth: AuthService) {
    this.emailForm = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
    this.resetForm = this.fb.group({
      newPassword:     ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    });
  }

  sendLink() {
    if (this.emailForm.invalid) { this.emailForm.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    this.auth.forgotPassword(this.emailForm.value).subscribe({
      next: (res) => {
        this.success.set(true);
        this.resetToken.set(res.data?.resetToken ?? '');
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'Failed to send reset link');
        this.loading.set(false);
      }
    });
  }

  updatePassword() {
    if (this.resetForm.invalid) { this.resetForm.markAllAsTouched(); return; }
    const { newPassword, confirmPassword } = this.resetForm.value;
    if (newPassword !== confirmPassword) { this.error.set('Passwords do not match'); return; }
    this.loading.set(true);
    this.auth.resetPassword({ token: this.resetToken(), newPassword, confirmPassword }).subscribe({
      next: () => { this.resetToken.set(''); this.success.set(false); this.loading.set(false); },
      error: (e) => { this.error.set(e.error?.message ?? 'Reset failed'); this.loading.set(false); }
    });
  }
}
