import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MilestoneService } from '../../../core/services/milestone.service';
import { AuthService } from '../../../core/services/auth.service';
import { MilestoneResponse } from '../../../core/models/milestone.model';

@Component({
  selector: 'app-review-proof',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="text-sm text-slate-400 mb-4">Approvals / {{ borrowerName() }} / M{{ milestone()?.sequenceNumber }}</div>

    <div class="page-header">
      <h1 class="page-title">Review Milestone Proof</h1>
      <p class="page-subtitle">Verify submitted proof; approve, partially approve, or reject; release tranche</p>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16"><span class="spinner w-8 h-8"></span></div>
    } @else {
      <!-- Milestone selector -->
      <div class="card mb-4 max-w-4xl">
        <label class="form-label">Select Milestone</label>
        <select class="form-select" (change)="selectMilestone($event)">
          <option value="">Choose milestone with submitted proof…</option>
          @for (m of milestones(); track m.id) {
            @if (m.status === 'PROOF_SUBMITTED') {
              <option [value]="m.id">M{{ m.sequenceNumber }} · {{ m.description }} — {{ inr(m.amount) }}</option>
            }
          }
        </select>
      </div>

      @if (milestone()) {
        <div class="max-w-4xl grid sm:grid-cols-2 gap-4">
          <!-- Proof -->
          <div class="card">
            <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Submitted Proof</h2>
            <div class="space-y-3">
              <div class="drop-zone cursor-default hover:border-slate-300 hover:bg-white">
                <p class="text-slate-400 text-sm">📷 Photo preview</p>
                <p class="text-xs text-slate-300 mt-1">(Opens from server)</p>
              </div>
              <div class="drop-zone cursor-default hover:border-slate-300 hover:bg-white">
                <p class="text-slate-400 text-sm">📄 invoice.pdf</p>
              </div>
            </div>
          </div>

          <!-- Decision -->
          <div class="card">
            <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Decision</h2>

            @if (msg()) { <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4 text-emerald-700 text-sm">✅ {{ msg() }}</div> }
            @if (error()) { <div class="warning-bar mb-4">⚠️ {{ error() }}</div> }

            <form [formGroup]="form" class="space-y-4">
              <div>
                <label class="form-label">Amount to release (₹)</label>
                <input formControlName="amountToRelease" type="number" class="form-input"
                       [placeholder]="milestone()!.amount">
              </div>
              <div>
                <label class="form-label">Remarks</label>
                <textarea formControlName="remarks" class="form-input resize-none min-h-[80px]"
                          placeholder="Optional remarks…"></textarea>
              </div>

              <div class="flex gap-2">
                <button type="button" class="btn-success flex-1 text-sm" [disabled]="actioning()" (click)="decide('APPROVED')">
                  @if (actioning() === 'APPROVED') { <span class="spinner w-3 h-3"></span> }
                  Approve
                </button>
                <button type="button" class="btn-secondary text-sm px-3" [disabled]="actioning()" (click)="decide('PARTIALLY_APPROVED')">
                  Partial
                </button>
                <button type="button" class="btn-danger text-sm px-3" [disabled]="actioning()" (click)="decide('REJECTED')">
                  Reject
                </button>
              </div>
            </form>

            <div class="info-bar mt-4 text-xs">
              ℹ️ Approval triggers disbursal and records an immutable transaction.
            </div>
          </div>
        </div>
      }
    }
  `
})
export class ReviewProofComponent implements OnInit {
  form: FormGroup;
  milestones = signal<MilestoneResponse[]>([]);
  milestone = signal<MilestoneResponse | null>(null);
  borrowerName = signal('');
  loading = signal(true);
  actioning = signal<string | null>(null);
  msg = signal('');
  error = signal('');
  private loanId = 0;

  constructor(private fb: FormBuilder, private mSvc: MilestoneService,
              private auth: AuthService, private route: ActivatedRoute) {
    this.form = this.fb.group({
      amountToRelease: [null, [Validators.required, Validators.min(0)]],
      remarks: ['']
    });
  }

  ngOnInit() {
    this.loanId = +this.route.snapshot.paramMap.get('loanId')!;
    this.mSvc.getMilestonesByLoan(this.loanId).subscribe({
      next: res => { this.milestones.set(res.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  selectMilestone(e: Event) {
    const id = +(e.target as HTMLSelectElement).value;
    const m = this.milestones().find(x => x.id === id) ?? null;
    this.milestone.set(m);
    if (m) this.form.patchValue({ amountToRelease: m.amount });
  }

  decide(decision: 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED') {
    if (!this.milestone()) return;
    this.actioning.set(decision);
    const managerId = this.auth.currentUser()!.id;
    this.mSvc.reviewMilestone(this.milestone()!.id, managerId, {
      decision, amountToRelease: +this.form.value.amountToRelease, remarks: this.form.value.remarks
    }).subscribe({
      next: () => { this.msg.set(`Milestone ${decision.toLowerCase().replace('_', ' ')} successfully.`); this.actioning.set(null); },
      error: e => { this.error.set(e.error?.message ?? 'Action failed'); this.actioning.set(null); }
    });
  }

  inr(v: number) { return '₹' + (v ?? 0).toLocaleString('en-IN'); }
}
