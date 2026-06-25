import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, FormArray, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MilestoneService } from '../../../core/services/milestone.service';
import { LoanService } from '../../../core/services/loan.service';
import { AuthService } from '../../../core/services/auth.service';
import { MilestoneResponse } from '../../../core/models/milestone.model';
import { LoanResponse } from '../../../core/models/loan.model';

@Component({
  selector: 'app-milestone-setup',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <h1 class="page-title">Milestones</h1>
      <p class="page-subtitle">Define ≥3 milestones; allocations must sum to 80% fund. 10% retention on last.</p>
    </div>

    <div class="max-w-3xl">
      @if (!loanId()) {
        <div class="card text-center py-10">
          <p class="text-slate-500 mb-4">No sanctioned loan found.</p>
          <a routerLink="/borrower/apply" class="btn-primary">Apply for a loan</a>
        </div>
      } @else {
        @if (saved().length > 0) {
          <!-- Existing milestones -->
          <div class="card mb-4">
            <h2 class="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Current Milestones</h2>
            <div class="table-wrapper">
              <table class="ts-table">
                <thead><tr><th>#</th><th>Description</th><th>Amount</th><th>Retention</th><th>Status</th></tr></thead>
                <tbody>
                  @for (m of saved(); track m.id) {
                    <tr>
                      <td>{{ m.sequenceNumber }}</td>
                      <td class="font-medium">{{ m.description }}</td>
                      <td>{{ inr(m.amount) }}</td>
                      <td>{{ m.retentionAmount > 0 ? inr(m.retentionAmount) : '—' }}</td>
                      <td><span [class]="badge(m.status)" class="badge">{{ m.status | titlecase }}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- Setup form -->
        <div class="card">
          <h2 class="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-1">Set up milestones</h2>
          <p class="text-xs text-slate-400 mb-4">Minimum 3 phases · allocations must total {{ inr(milestoneFund()) }}</p>

          @if (error()) { <div class="warning-bar mb-4">⚠️ {{ error() }}</div> }

          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="mb-4 space-y-3">
              <div class="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase px-2">
                <div class="col-span-1">#</div>
                <div class="col-span-6">Description</div>
                <div class="col-span-3">Amount (₹)</div>
                <div class="col-span-2">Retention</div>
              </div>

              @for (mg of milestoneRows.controls; track mg; let idx = $index; let last = $last) {
                <div [formGroupName]="idx" class="grid grid-cols-12 gap-2 items-center">
                  <div class="col-span-1 text-sm text-slate-500 pl-2">
                    {{ idx + 1 }}{{ last ? ' 🔒' : '' }}
                  </div>
                  <div class="col-span-6">
                    <input formControlName="description" class="form-input text-sm" placeholder="e.g. Renovation">
                  </div>
                  <div class="col-span-3">
                    <input formControlName="amount" type="number" class="form-input text-sm" placeholder="50000">
                  </div>
                  <div class="col-span-2 text-sm text-slate-500">
                    {{ last ? inr(retentionOn(idx)) : '—' }}
                  </div>
                </div>
              }
            </div>

            <!-- Allocation bar -->
            <div class="flex items-center justify-between p-3 rounded-lg mb-4"
                 [class]="isBalanced() ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'">
              <span class="text-sm font-medium" [class]="isBalanced() ? 'text-emerald-700' : 'text-amber-700'">
                Allocated: {{ inr(totalAllocated()) }} / {{ inr(milestoneFund()) }}
              </span>
              <span [class]="isBalanced() ? 'badge-green' : 'badge-amber'" class="badge">
                {{ isBalanced() ? 'balanced' : 'unbalanced' }}
              </span>
            </div>

            <div class="flex gap-3">
              <button type="button" class="btn-secondary text-sm" (click)="addRow()">+ Add milestone</button>
              @if (milestoneRows.length > 3) {
                <button type="button" class="btn-ghost text-sm text-red-500" (click)="removeRow()">Remove last</button>
              }
              <button type="submit" [disabled]="loading() || !isBalanced()" class="btn-primary ml-auto">
                @if (loading()) { <span class="spinner w-4 h-4"></span> }
                Save milestones
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `
})
export class MilestoneSetupComponent implements OnInit {
  form: FormGroup;
  loanId = signal<number | null>(null);
  milestoneFund = signal(0);
  saved = signal<MilestoneResponse[]>([]);
  loading = signal(false);
  error = signal('');

  get milestoneRows() { return this.form.get('milestones') as FormArray; }

  totalAllocated = computed(() => {
    try {
      return this.milestoneRows.controls.reduce((s, c) => s + (+(c.get('amount')?.value ?? 0)), 0);
    } catch { return 0; }
  });

  isBalanced = computed(() => this.totalAllocated() === this.milestoneFund() && this.milestoneFund() > 0);

  constructor(private fb: FormBuilder, private mSvc: MilestoneService,
              private loanSvc: LoanService, private auth: AuthService) {
    this.form = this.fb.group({ milestones: this.fb.array([]) });
    [0, 1, 2].forEach(() => this.addRow());
  }

  ngOnInit() {
    const uid = this.auth.currentUser()?.id;
    if (!uid) return;
    this.loanSvc.getLoansByBorrower(uid).subscribe(res => {
      const loan = res.data?.find((l: LoanResponse) => ['SANCTIONED', 'ACTIVE', 'MORATORIUM'].includes(l.status));
      if (!loan) return;
      this.loanId.set(loan.id);
      this.milestoneFund.set(loan.milestoneFund);
      this.mSvc.getMilestonesByLoan(loan.id).subscribe(r => this.saved.set(r.data ?? []));
    });
  }

  addRow() {
    this.milestoneRows.push(this.fb.group({
      description: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]]
    }));
  }

  removeRow() {
    if (this.milestoneRows.length > 3) this.milestoneRows.removeAt(this.milestoneRows.length - 1);
  }

  retentionOn(i: number) {
    if (i !== this.milestoneRows.length - 1) return 0;
    const amt = +(this.milestoneRows.at(i).get('amount')?.value ?? 0);
    return Math.round(amt * 0.10);
  }

  save() {
    if (!this.isBalanced() || !this.loanId()) return;
    this.loading.set(true);
    this.error.set('');
    const milestones = this.milestoneRows.value.map((m: any, i: number, arr: any[]) => ({
      ...m, isLast: i === arr.length - 1
    }));
    this.mSvc.saveMilestones(this.loanId()!, { milestones }).subscribe({
      next: res => { this.saved.set(res.data ?? []); this.loading.set(false); },
      error: e => { this.error.set(e.error?.message ?? 'Save failed'); this.loading.set(false); }
    });
  }

  inr(v: number) { return '₹' + (v ?? 0).toLocaleString('en-IN'); }

  badge(s: string) {
    const m: Record<string, string> = {
      COMPLETED: 'badge-green', IN_PROGRESS: 'badge-blue',
      APPROVED: 'badge-green', PENDING: 'badge-slate',
      PROOF_SUBMITTED: 'badge-amber', REJECTED: 'badge-red'
    };
    return m[s] ?? 'badge-slate';
  }
}
