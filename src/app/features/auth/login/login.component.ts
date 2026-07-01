import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <h2 class="text-xl font-bold text-slate-900 mb-1">Sign in</h2>
    <p class="text-sm text-slate-500 mb-6">Welcome back to TrustStep</p>

    @if (error()) {
      <div class="warning-bar mb-4">⚠️ {{ error() }}</div>
    }

    <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
      <div>
        <label class="form-label">Email</label>
        <input formControlName="email" type="email" class="form-input" placeholder="you@example.com">
        @if (form.get('email')?.invalid && form.get('email')?.touched) {
          <p class="form-error">Valid email required</p>
        }
      </div>

      <div>
        <label class="form-label">Password</label>
        <div class="relative">
          <input formControlName="password" [type]="showPwd() ? 'text' : 'password'"
                 class="form-input pr-10" placeholder="••••••••">
          <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  (click)="togglePwd()">
            {{ showPwd() ? '🙈' : '👁️' }}
          </button>
        </div>
        @if (form.get('password')?.invalid && form.get('password')?.touched) {
          <p class="form-error">Password required</p>
        }
      </div>

      <button type="submit" [disabled]="loading()" class="btn-primary w-full">
        @if (loading()) { <span class="spinner w-4 h-4"></span> }
        Sign in
      </button>
    </form>

    <div class="mt-5 text-center space-y-2">
      <a routerLink="/forgot-password" class="text-sm text-primary-600 hover:underline block">Forgot password?</a>
      <p class="text-sm text-slate-500">New user?
        <a routerLink="/register" class="text-primary-600 font-medium hover:underline">Register</a>
      </p>
    </div>

    <p class="mt-4 text-xs text-slate-400 text-center">
      Role is detected automatically and routes to the correct dashboard.
    </p>
  `
})
export class LoginComponent {
  form: FormGroup;
  loading = signal(false);
  showPwd = signal(false);
  error = signal('');

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private toast: ToastService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  togglePwd() { this.showPwd.update(v => !v); }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.form.value).subscribe({
      next: () => {
        this.auth.fetchCurrentUser().subscribe({
          next: () => { this.toast.success('Logged in successfully!'); this.auth.navigateToDashboard(); },
          error: () => { this.toast.success('Logged in successfully!'); this.auth.navigateToDashboard(); }
        });
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'Invalid credentials');
        this.toast.error(e.error?.message ?? 'Invalid credentials');
        this.loading.set(false);
      }
    });
  }
}
