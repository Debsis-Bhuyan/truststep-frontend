import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MilestoneService } from '../../../core/services/milestone.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoanService } from '../../../core/services/loan.service';
import { MilestoneResponse, MilestoneProofResponse } from '../../../core/models/milestone.model';
import { LoanResponse } from '../../../core/models/loan.model';

@Component({
  selector: 'app-review-proof',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="text-sm text-slate-400 mb-4">Approvals / Milestone Proof Review</div>

    <div class="page-header">
      <h1 class="page-title">Review Milestone Proof</h1>
      <p class="page-subtitle">Verify submitted proof · approve, partially approve, or reject · release tranche</p>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16"><span class="spinner w-8 h-8"></span></div>
    } @else {
      <!-- Milestone selector -->
      <div class="card mb-4 max-w-4xl">
        <label class="form-label">Select Milestone with Submitted Proof</label>
        <select class="form-select" (change)="selectMilestone($event)">
          <option value="">Choose milestone…</option>
          @for (m of milestones(); track m.milestoneId) {
            @if (m.status === 'PROOF_SUBMITTED' || m.status === 'PARTIALLY_APPROVED') {
              <option [value]="m.milestoneId">
                M{{ m.phaseNumber }} · {{ m.description }} — {{ inr(m.allocatedAmount) }} [{{ m.status }}]
              </option>
            }
          }
        </select>
        @if (milestones().length > 0 && noProofMilestones()) {
          <p class="text-xs text-slate-400 mt-2">No milestones with submitted proofs yet.</p>
        }
      </div>

      @if (milestone()) {
        <div class="max-w-4xl grid sm:grid-cols-2 gap-4">
          <!-- Proof list -->
          <div class="card">
            <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Submitted Proofs</h2>
            @if (proofs().length === 0) {
              <p class="text-sm text-slate-400">Loading proofs…</p>
            }
            <div class="space-y-3">
              @for (p of proofs(); track p.proofId) {
                <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div class="text-2xl">{{ proofIcon(p.proofType) }}</div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-slate-800 truncate">{{ p.fileName }}</p>
                    <p class="text-xs text-slate-400">{{ p.proofType }} · {{ p.description }}</p>
                  </div>
                  @if (p.fileUrl) {
                    <a [href]="p.fileUrl" target="_blank" class="text-xs text-primary-600 hover:underline shrink-0">View</a>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Decision form -->
          <div class="card">
            <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Decision</h2>

            @if (msg()) { <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4 text-emerald-700 text-sm">✅ {{ msg() }}</div> }
            @if (error()) { <div class="warning-bar mb-4">⚠️ {{ error() }}</div> }

            <form [formGroup]="form" class="space-y-4">
              <div>
                <label class="form-label">Amount to release (₹)</label>
                <input formControlName="amountToRelease" type="number" class="form-input"
                       [placeholder]="milestone()!.releasableAmount">
              </div>
              <div>
                <label class="form-label">Remarks</label>
                <textarea formControlName="remarks" class="form-input resize-none min-h-[70px]"
                          placeholder="Optional remarks…"></textarea>
              </div>
              <div>
                <label class="form-label">Rejection reason (if rejecting)</label>
                <input formControlName="rejectionReason" class="form-input" placeholder="Reason for rejection…">
              </div>

              <div class="flex gap-2">
                <button type="button" class="btn-success flex-1 text-sm"
                        [disabled]="actioning()" (click)="decide('APPROVED')">
                  @if (actioning() === 'APPROVED') { <span class="spinner w-3 h-3"></span> }
                  Approve
                </button>
                <button type="button" class="btn-secondary text-sm px-3"
                        [disabled]="actioning()" (click)="decide('PARTIALLY_APPROVED')">
                  Partial
                </button>
                <button type="button" class="btn-danger text-sm px-3"
                        [disabled]="actioning()" (click)="decide('REJECTED')">
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
  proofs     = signal<MilestoneProofResponse[]>([]);
  milestone  = signal<MilestoneResponse | null>(null);
  loading    = signal(true);
  actioning  = signal<string | null>(null);
  msg        = signal('');
  error      = signal('');
  private loanId = 0;

  noProofMilestones() {
    return !this.milestones().some(m => m.status === 'PROOF_SUBMITTED' || m.status === 'PARTIALLY_APPROVED');
  }

  constructor(private fb: FormBuilder, private mSvc: MilestoneService,
              private loanSvc: LoanService, private auth: AuthService,
              private route: ActivatedRoute) {
    this.form = this.fb.group({
      amountToRelease: [null, [Validators.required, Validators.min(0)]],
      remarks:         [''],
      rejectionReason: ['']
    });
  }

  ngOnInit() {
    this.loanId = +this.route.snapshot.paramMap.get('loanId')!;
    if (!this.loanId) { this.loadAllAssigned(); return; }
    this.mSvc.getMilestonesByLoan(this.loanId).subscribe({
      next: res => { this.milestones.set(res.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  loadAllAssigned() {
    const uid = this.auth.currentUser()?.id;
    if (!uid) { this.loading.set(false); return; }
    this.loanSvc.getLoansByManager(uid).subscribe(res => {
      const loans = res.data ?? [];
      const pending: MilestoneResponse[] = [];
      let done = 0;
      if (loans.length === 0) { this.loading.set(false); return; }
      loans.forEach((l: LoanResponse) => {
        this.mSvc.getMilestonesByLoan(l.loanId).subscribe({
          next: r => {
            pending.push(...(r.data ?? []).filter(m => m.status === 'PROOF_SUBMITTED' || m.status === 'PARTIALLY_APPROVED'));
            if (++done === loans.length) { this.milestones.set(pending); this.loading.set(false); }
          },
          error: () => { if (++done === loans.length) this.loading.set(false); }
        });
      });
    });
  }

  selectMilestone(e: Event) {
    const id = +(e.target as HTMLSelectElement).value;
    const m = this.milestones().find(x => x.milestoneId === id) ?? null;
    this.milestone.set(m);
    this.msg.set(''); this.error.set('');
    if (m) {
      this.form.patchValue({ amountToRelease: m.releasableAmount });
      this.mSvc.getProofsByMilestone(m.milestoneId).subscribe(r => this.proofs.set(r.data ?? []));
    }
  }

  decide(decision: 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED') {
    if (!this.milestone() || this.form.get('amountToRelease')?.invalid) return;
    this.actioning.set(decision);
    const uid = this.auth.currentUser()!.id;
    this.mSvc.reviewMilestone(this.milestone()!.milestoneId, {
      milestoneId:     this.milestone()!.milestoneId,
      loanId:          this.milestone()!.loanId,
      reviewedById:    uid,
      decision,
      amountToRelease: +this.form.value.amountToRelease,
      remarks:         this.form.value.remarks,
      rejectionReason: this.form.value.rejectionReason
    }).subscribe({
      next: () => {
        this.msg.set(`Milestone ${decision.toLowerCase().replace('_', ' ')}.`);
        this.actioning.set(null);
      },
      error: e => { this.error.set(e.error?.message ?? 'Action failed'); this.actioning.set(null); }
    });
  }

  proofIcon(t: string) {
    return { PHOTO: '📷', INVOICE: '🧾', RECEIPT: '🧾', OTHER: '📎' }[t] ?? '📎';
  }

  inr(v: number) { return '₹' + (v ?? 0).toLocaleString('en-IN'); }
}
