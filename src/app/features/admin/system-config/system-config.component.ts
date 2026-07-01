import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-system-config',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <!-- Page header -->
    <div class="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="page-title">System Configuration</h1>
        <p class="page-subtitle">Adjust global rates, limits, and disbursement rules. All changes are audit-logged.</p>
      </div>
      <button type="button" (click)="save()" [disabled]="saving() || loading()"
              class="btn-primary self-start sm:self-auto shrink-0">
        @if (saving()) { <span class="spinner w-4 h-4"></span> }
        @else { <span>💾</span> }
        Save Configuration
      </button>
    </div>

    @if (loading()) {
      <div class="flex justify-center items-center py-24">
        <span class="spinner w-10 h-10"></span>
      </div>
    } @else {
      <form [formGroup]="form" (ngSubmit)="save()">
        <div class="grid lg:grid-cols-3 gap-6">

          <!-- ── LEFT: form sections (2 cols on lg) ─────────── -->
          <div class="lg:col-span-2 space-y-6">

            <!-- Interest Rates -->
            <div class="card">
              <div class="flex items-center gap-3 mb-5">
                <div class="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-lg shrink-0">💹</div>
                <div>
                  <h2 class="text-sm font-semibold text-slate-900">Interest Rates</h2>
                  <p class="text-xs text-slate-500">Applied to loan principal on reducing-balance basis</p>
                </div>
              </div>
              <div class="grid sm:grid-cols-2 gap-5">
                <div>
                  <label class="form-label">Base Interest Rate <span class="text-slate-400 font-normal">(% per annum)</span></label>
                  <div class="relative">
                    <input formControlName="baseInterestRate" type="number" step="0.1" min="0"
                           class="form-input pr-8" placeholder="e.g. 11.5">
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">%</span>
                  </div>
                  @if (f['baseInterestRate'].invalid && f['baseInterestRate'].touched) {
                    <p class="form-error">Required, must be ≥ 0</p>
                  }
                  <p class="text-xs text-slate-400 mt-1.5">Applied after moratorium period ends</p>
                </div>
                <div>
                  <label class="form-label">Moratorium Rate <span class="text-slate-400 font-normal">(% per annum)</span></label>
                  <div class="relative">
                    <input formControlName="moratoriumRate" type="number" step="0.1" min="0"
                           class="form-input pr-8" placeholder="e.g. 11.5">
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">%</span>
                  </div>
                  @if (f['moratoriumRate'].invalid && f['moratoriumRate'].touched) {
                    <p class="form-error">Required, must be ≥ 0</p>
                  }
                  <p class="text-xs text-slate-400 mt-1.5">Simple interest accrued during grace period</p>
                </div>
              </div>
            </div>

            <!-- Loan Structure -->
            <div class="card">
              <div class="flex items-center gap-3 mb-5">
                <div class="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-lg shrink-0">🏗️</div>
                <div>
                  <h2 class="text-sm font-semibold text-slate-900">Loan Structure</h2>
                  <p class="text-xs text-slate-500">Controls how the loan principal is split and retained</p>
                </div>
              </div>
              <div class="grid sm:grid-cols-2 gap-5">
                <div>
                  <label class="form-label">Retention Percentage <span class="text-slate-400 font-normal">(%)</span></label>
                  <div class="relative">
                    <input formControlName="retentionPercent" type="number" step="0.1" min="0" max="100"
                           class="form-input pr-8" placeholder="e.g. 10">
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">%</span>
                  </div>
                  @if (f['retentionPercent'].invalid && f['retentionPercent'].touched) {
                    <p class="form-error">Required, 0–100</p>
                  }
                  <p class="text-xs text-slate-400 mt-1.5">Withheld from the last milestone until loan completion</p>
                </div>
                <div>
                  <label class="form-label">Forward Draw Cap <span class="text-slate-400 font-normal">(%)</span></label>
                  <div class="relative">
                    <input formControlName="forwardDrawCapPercent" type="number" step="0.1" min="0" max="100"
                           class="form-input pr-8" placeholder="e.g. 50">
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">%</span>
                  </div>
                  @if (f['forwardDrawCapPercent'].invalid && f['forwardDrawCapPercent'].touched) {
                    <p class="form-error">Required, 0–100</p>
                  }
                  <p class="text-xs text-slate-400 mt-1.5">Max % of a future milestone borrower can pull forward (once)</p>
                </div>
              </div>
            </div>

            <!-- Moratorium Period -->
            <div class="card">
              <div class="flex items-center gap-3 mb-5">
                <div class="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-lg shrink-0">📅</div>
                <div>
                  <h2 class="text-sm font-semibold text-slate-900">Moratorium Period</h2>
                  <p class="text-xs text-slate-500">Grace window before EMI repayment begins</p>
                </div>
              </div>
              <div class="grid sm:grid-cols-2 gap-5">
                <div>
                  <label class="form-label">Duration <span class="text-slate-400 font-normal">(months)</span></label>
                  <div class="relative">
                    <input formControlName="moratoriumMonths" type="number" min="0"
                           class="form-input pr-16" placeholder="e.g. 3">
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">months</span>
                  </div>
                  @if (f['moratoriumMonths'].invalid && f['moratoriumMonths'].touched) {
                    <p class="form-error">Required, must be ≥ 0</p>
                  }
                  <p class="text-xs text-slate-400 mt-1.5">Calculated from date of first disbursement</p>
                </div>
                <div class="flex items-start pt-6">
                  <div class="info-bar text-xs w-full">
                    <span>ℹ️</span>
                    <span>During moratorium, only simple interest accrues at the moratorium rate. No EMIs are collected.</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Audit note -->
            <div class="info-bar text-sm">
              <span class="text-lg">📑</span>
              <span>All configuration changes are recorded in the immutable audit log and attributed to your admin account.</span>
            </div>
          </div>

          <!-- ── RIGHT: live summary panel ───────────────────── -->
          <div class="space-y-5">
            <div class="card sticky top-6">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Live Preview</h3>

              <div class="grid grid-cols-2 gap-3 mb-5">
                <div class="rounded-xl bg-blue-50 border border-blue-100 p-3 text-center">
                  <p class="text-xl font-bold text-blue-700">{{ f['baseInterestRate'].value ?? '—' }}%</p>
                  <p class="text-xs text-blue-500 mt-0.5">Base Rate</p>
                </div>
                <div class="rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-center">
                  <p class="text-xl font-bold text-indigo-700">{{ f['moratoriumRate'].value ?? '—' }}%</p>
                  <p class="text-xs text-indigo-500 mt-0.5">Morat. Rate</p>
                </div>
                <div class="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
                  <p class="text-xl font-bold text-emerald-700">{{ f['retentionPercent'].value ?? '—' }}%</p>
                  <p class="text-xs text-emerald-500 mt-0.5">Retention</p>
                </div>
                <div class="rounded-xl bg-amber-50 border border-amber-100 p-3 text-center">
                  <p class="text-xl font-bold text-amber-700">{{ f['moratoriumMonths'].value ?? '—' }}</p>
                  <p class="text-xs text-amber-500 mt-0.5">Morat. Months</p>
                </div>
                <div class="rounded-xl bg-purple-50 border border-purple-100 p-3 text-center col-span-2">
                  <p class="text-xl font-bold text-purple-700">{{ f['forwardDrawCapPercent'].value ?? '—' }}%</p>
                  <p class="text-xs text-purple-500 mt-0.5">Forward Draw Cap</p>
                </div>
              </div>

              <!-- Rule summaries -->
              <div class="space-y-2.5 mb-5">
                <div class="flex items-start gap-2 text-xs text-slate-600">
                  <span class="text-emerald-500 mt-0.5 shrink-0">✓</span>
                  <span><strong>80%</strong> of loan → milestone fund (tranches)</span>
                </div>
                <div class="flex items-start gap-2 text-xs text-slate-600">
                  <span class="text-emerald-500 mt-0.5 shrink-0">✓</span>
                  <span><strong>20%</strong> of loan → emergency buffer</span>
                </div>
                <div class="flex items-start gap-2 text-xs text-slate-600">
                  <span class="text-emerald-500 mt-0.5 shrink-0">✓</span>
                  <span>Last milestone: <strong>{{ f['retentionPercent'].value ?? 10 }}%</strong> withheld until completion</span>
                </div>
                <div class="flex items-start gap-2 text-xs text-slate-600">
                  <span class="text-emerald-500 mt-0.5 shrink-0">✓</span>
                  <span>Forward draw: up to <strong>{{ f['forwardDrawCapPercent'].value ?? 50 }}%</strong> of next milestone</span>
                </div>
              </div>

              <button type="button" (click)="save()" [disabled]="saving() || loading()"
                      class="btn-primary w-full">
                @if (saving()) { <span class="spinner w-4 h-4"></span> }
                @else { <span>💾</span> }
                Save
              </button>
            </div>
          </div>

        </div>
      </form>
    }
  `
})
export class SystemConfigComponent implements OnInit {
  private toast = inject(ToastService);

  form: FormGroup;
  loading = signal(true);
  saving  = signal(false);

  constructor(private fb: FormBuilder, private svc: AdminService) {
    this.form = this.fb.group({
      baseInterestRate:      [11.5, [Validators.required, Validators.min(0)]],
      moratoriumRate:        [11.5, [Validators.required, Validators.min(0)]],
      retentionPercent:      [10,   [Validators.required, Validators.min(0), Validators.max(100)]],
      moratoriumMonths:      [3,    [Validators.required, Validators.min(0)]],
      forwardDrawCapPercent: [50,   [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  get f() { return this.form.controls; }

  ngOnInit() {
    this.svc.getSystemConfig().subscribe({
      next: res => { if (res.data) this.form.patchValue(res.data); this.loading.set(false); },
      error: ()  => this.loading.set(false)
    });
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.svc.saveSystemConfig(this.form.value).subscribe({
      next: () => { this.toast.success('Configuration saved successfully!'); this.saving.set(false); },
      error: e  => { this.toast.error(e.error?.message ?? 'Save failed'); this.saving.set(false); }
    });
  }
}
