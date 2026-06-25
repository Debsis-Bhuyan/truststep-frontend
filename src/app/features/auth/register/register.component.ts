import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <h2 class="text-xl font-bold text-slate-900 mb-1">Create account</h2>

    <!-- Step indicator -->
    <div class="flex items-center gap-2 mb-6 mt-2">
      @for (s of steps; track s.num) {
        <div class="flex items-center gap-1">
          <div [class]="step() >= s.num ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-500'"
               class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold">
            {{ s.num }}
          </div>
          <span class="text-xs" [class]="step() >= s.num ? 'text-primary-700 font-medium' : 'text-slate-400'">
            {{ s.label }}
          </span>
        </div>
        @if (!$last) { <div class="flex-1 h-px bg-slate-200 mx-1"></div> }
      }
    </div>

    @if (error()) { <div class="warning-bar mb-4">⚠️ {{ error() }}</div> }

    <form [formGroup]="form" (ngSubmit)="submit()">

      <!-- Step 1: Details -->
      @if (step() === 1) {
        <div class="space-y-4">
          <div>
            <label class="form-label">Full name</label>
            <input formControlName="fullName" class="form-input" placeholder="Ramesh Kumar">
            @if (f['fullName'].invalid && f['fullName'].touched) {
              <p class="form-error">Full name required</p>
            }
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="form-label">Email</label>
              <input formControlName="email" type="email" class="form-input" placeholder="you@example.com">
              @if (f['email'].invalid && f['email'].touched) {
                <p class="form-error">Valid email required</p>
              }
            </div>
            <div>
              <label class="form-label">Phone</label>
              <input formControlName="phone" class="form-input" placeholder="9XXXXXXXXX">
              @if (f['phone'].invalid && f['phone'].touched) {
                <p class="form-error">10-digit phone required</p>
              }
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="form-label">Password</label>
              <input formControlName="password" type="password" class="form-input" placeholder="••••••••">
              @if (f['password'].invalid && f['password'].touched) {
                <p class="form-error">Min 8 characters</p>
              }
            </div>
            <div>
              <label class="form-label">Confirm</label>
              <input formControlName="confirmPassword" type="password" class="form-input" placeholder="••••••••">
              @if (form.errors?.['mismatch'] && f['confirmPassword'].touched) {
                <p class="form-error">Passwords don't match</p>
              }
            </div>
          </div>
          <button type="button" class="btn-primary w-full" (click)="nextStep()">Continue</button>
        </div>
      }

      <!-- Step 2: KYC -->
      @if (step() === 2) {
        <div class="space-y-4">
          <div>
            <label class="form-label">PAN <span class="badge-blue ml-1">encrypted</span></label>
            <input formControlName="panNumber" class="form-input uppercase" placeholder="ABCDE1234F" maxlength="10">
            @if (f['panNumber'].invalid && f['panNumber'].touched) {
              <p class="form-error">Valid PAN format required (e.g. ABCDE1234F)</p>
            }
          </div>
          <div>
            <label class="form-label">Aadhaar <span class="badge-slate ml-1">hash + last 4</span></label>
            <input formControlName="aadhaarNumber" class="form-input" placeholder="XXXX XXXX 9012" maxlength="12">
            @if (f['aadhaarNumber'].invalid && f['aadhaarNumber'].touched) {
              <p class="form-error">Enter your 12-digit Aadhaar number</p>
            }
          </div>
          <div class="info-bar">
            ℹ️ Validation on email / phone / PAN format before submit.
          </div>
          <div class="flex gap-3">
            <button type="button" class="btn-secondary flex-1" (click)="step.set(1)">Back</button>
            <button type="submit" [disabled]="loading()" class="btn-primary flex-1">
              @if (loading()) { <span class="spinner w-4 h-4"></span> }
              Create account
            </button>
          </div>
        </div>
      }

      <!-- Step 3: Done -->
      @if (step() === 3) {
        <div class="text-center py-4">
          <div class="text-5xl mb-3">🎉</div>
          <h3 class="text-lg font-semibold text-slate-900">Account created!</h3>
          <p class="text-sm text-slate-500 mt-1">Redirecting to your dashboard…</p>
        </div>
      }
    </form>

    @if (step() === 1) {
      <p class="text-sm text-slate-500 text-center mt-5">
        Already have an account? <a routerLink="/login" class="text-primary-600 font-medium hover:underline">Sign in</a>
      </p>
    }
  `
})
export class RegisterComponent {
  step = signal(1);
  loading = signal(false);
  error = signal('');
  steps = [{ num: 1, label: 'Details' }, { num: 2, label: 'KYC' }, { num: 3, label: 'Done' }];

  form: FormGroup;
  get f() { return this.form.controls; }

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      fullName:         ['', Validators.required],
      email:            ['', [Validators.required, Validators.email]],
      phone:            ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      password:         ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword:  ['', Validators.required],
      panNumber:        ['', [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/)]],
      aadhaarNumber:    ['', [Validators.required, Validators.pattern(/^\d{12}$/)]]
    }, { validators: this.passwordMatch });
  }

  passwordMatch(g: AbstractControl) {
    return g.get('password')?.value === g.get('confirmPassword')?.value ? null : { mismatch: true };
  }

  nextStep() {
    const step1Fields = ['fullName', 'email', 'phone', 'password', 'confirmPassword'];
    step1Fields.forEach(k => this.f[k].markAsTouched());
    const valid = step1Fields.every(k => this.f[k].valid) && !this.form.errors?.['mismatch'];
    if (valid) this.step.set(2);
  }

  submit() {
    ['panNumber', 'aadhaarNumber'].forEach(k => this.f[k].markAsTouched());
    if (this.f['panNumber'].invalid || this.f['aadhaarNumber'].invalid) return;
    this.loading.set(true);
    this.error.set('');
    const {  ...payload } = this.form.value;
    this.auth.register(payload).subscribe({
      next: () => {
        this.step.set(3);
        setTimeout(() => this.auth.navigateToDashboard(), 1500);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'Registration failed');
        this.loading.set(false);
      }
    });
  }
}
