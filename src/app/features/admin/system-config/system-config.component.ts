import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-system-config',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">System Configuration</h1>
      <p class="page-subtitle">Configure rates, limits, retention %, moratorium length</p>
    </div>

    <div class="max-w-2xl">
      <div class="card">
        @if (saved()) {
          <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4 text-emerald-700 text-sm">
            ✅ Configuration saved successfully.
          </div>
        }
        @if (error()) { <div class="warning-bar mb-4">⚠️ {{ error() }}</div> }

        @if (loading()) {
          <div class="flex justify-center py-10"><span class="spinner w-8 h-8"></span></div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="save()" class="space-y-6">
            <div>
              <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Interest</h2>
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Base rate (%)</label>
                  <input formControlName="baseInterestRate" type="number" step="0.1" class="form-input">
                </div>
                <div>
                  <label class="form-label">Moratorium rate (%)</label>
                  <input formControlName="moratoriumRate" type="number" step="0.1" class="form-input">
                </div>
              </div>
            </div>

            <div class="border-t border-slate-100 pt-5">
              <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Limits & Rules</h2>
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Retention (%)</label>
                  <input formControlName="retentionPercent" type="number" step="0.1" class="form-input">
                </div>
                <div>
                  <label class="form-label">Moratorium (months)</label>
                  <input formControlName="moratoriumMonths" type="number" class="form-input">
                </div>
                <div>
                  <label class="form-label">Forward draw cap (%)</label>
                  <input formControlName="forwardDrawCapPercent" type="number" step="0.1" class="form-input">
                </div>
              </div>
            </div>

            <div class="info-bar text-xs">
              ℹ️ Changes are recorded in the audit log.
            </div>

            <button type="submit" [disabled]="saving()" class="btn-primary">
              @if (saving()) { <span class="spinner w-4 h-4"></span> }
              Save configuration
            </button>
          </form>
        }
      </div>
    </div>
  `
})
export class SystemConfigComponent implements OnInit {
  form: FormGroup;
  loading = signal(true);
  saving = signal(false);
  saved = signal(false);
  error = signal('');

  constructor(private fb: FormBuilder, private svc: AdminService) {
    this.form = this.fb.group({
      baseInterestRate:    [11.5, [Validators.required, Validators.min(0)]],
      moratoriumRate:      [11.5, [Validators.required, Validators.min(0)]],
      retentionPercent:    [10,   [Validators.required, Validators.min(0), Validators.max(100)]],
      moratoriumMonths:    [3,    [Validators.required, Validators.min(0)]],
      forwardDrawCapPercent: [50, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  ngOnInit() {
    this.svc.getSystemConfig().subscribe({
      next: res => {
        if (res.data) this.form.patchValue(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.error.set('');
    this.svc.saveSystemConfig(this.form.value).subscribe({
      next: () => { this.saved.set(true); this.saving.set(false); setTimeout(() => this.saved.set(false), 3000); },
      error: e => { this.error.set(e.error?.message ?? 'Save failed'); this.saving.set(false); }
    });
  }
}
