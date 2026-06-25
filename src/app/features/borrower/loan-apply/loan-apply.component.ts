import { Component, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoanService } from '../../../core/services/loan.service';
import { AuthService } from '../../../core/services/auth.service';

const LOAN_TYPES = ['Shop Renovation', 'Stock Purchase', 'Equipment', 'Working Capital', 'Workshop Setup', 'Other'];

@Component({
  selector: 'app-loan-apply',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">Apply for a Loan</h1>
      <p class="page-subtitle">Fill in your loan details. System splits 80/20 on sanction.</p>
    </div>

    <div class="max-w-2xl">
      <div class="card">
        @if (error()) { <div class="warning-bar mb-4">⚠️ {{ error() }}</div> }
        @if (success()) {
          <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4 text-emerald-700 text-sm">
            ✅ Application submitted! Redirecting…
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="form-label">Loan amount (₹)</label>
              <input formControlName="loanAmount" type="number" class="form-input" placeholder="100000">
              @if (f['loanAmount'].invalid && f['loanAmount'].touched) {
                <p class="form-error">Min ₹10,000 required</p>
              }
            </div>
            <div>
              <label class="form-label">Tenure (months)</label>
              <input formControlName="tenureMonths" type="number" class="form-input" placeholder="24">
              @if (f['tenureMonths'].invalid && f['tenureMonths'].touched) {
                <p class="form-error">6–84 months</p>
              }
            </div>
          </div>

          <div>
            <label class="form-label">Loan type</label>
            <select formControlName="loanType" class="form-select">
              <option value="">Select type…</option>
              @for (t of loanTypes; track t) {
                <option [value]="t">{{ t }}</option>
              }
            </select>
          </div>

          <div>
            <label class="form-label">Purpose</label>
            <textarea formControlName="purpose" class="form-input min-h-[80px] resize-none"
                      placeholder="Describe how the funds will be used…"></textarea>
            @if (f['purpose'].invalid && f['purpose'].touched) {
              <p class="form-error">Purpose required</p>
            }
          </div>

          <!-- Auto preview -->
          @if (loanAmount() > 0) {
            <div class="bg-primary-50 border border-primary-100 rounded-xl p-4">
              <p class="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-2">Auto Preview (on sanction)</p>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="text-xs text-slate-500">Milestone fund (80%)</p>
                  <p class="text-lg font-bold text-primary-800">{{ inr(milestoneFund()) }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-500">Emergency fund (20%)</p>
                  <p class="text-lg font-bold text-emerald-700">{{ inr(emergencyFund()) }}</p>
                </div>
              </div>
            </div>
          }

          <div class="flex gap-3 pt-2">
            <button type="submit" [disabled]="loading()" class="btn-primary flex-1">
              @if (loading()) { <span class="spinner w-4 h-4"></span> }
              Submit application
            </button>
            <button type="button" (click)="form.reset()" class="btn-secondary">Save draft</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class LoanApplyComponent {
  form: FormGroup;
  get f() { return this.form.controls; }
  loading = signal(false);
  error = signal('');
  success = signal(false);
  loanTypes = LOAN_TYPES;

  loanAmount = computed(() => +(this.form?.get('loanAmount')?.value ?? 0));
  milestoneFund = computed(() => Math.round(this.loanAmount() * 0.8));
  emergencyFund = computed(() => Math.round(this.loanAmount() * 0.2));

  constructor(private fb: FormBuilder, private svc: LoanService, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      loanAmount:   [null, [Validators.required, Validators.min(10000)]],
      tenureMonths: [24,   [Validators.required, Validators.min(6), Validators.max(84)]],
      loanType:     ['',   Validators.required],
      purpose:      ['',   Validators.required]
    });
  }

  inr(v: number) { return '₹' + v.toLocaleString('en-IN'); }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const id = this.auth.currentUser()?.id;
    if (!id) return;
    this.loading.set(true);
    this.svc.applyLoan(id, this.form.value).subscribe({
      next: () => {
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/borrower/dashboard']), 1500);
      },
      error: e => { this.error.set(e.error?.message ?? 'Application failed'); this.loading.set(false); }
    });
  }
}
