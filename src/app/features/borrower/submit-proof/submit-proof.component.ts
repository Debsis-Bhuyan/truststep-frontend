import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MilestoneService } from '../../../core/services/milestone.service';
import { LoanService } from '../../../core/services/loan.service';
import { AuthService } from '../../../core/services/auth.service';
import { MilestoneResponse, ProofType } from '../../../core/models/milestone.model';
import { LoanResponse } from '../../../core/models/loan.model';

@Component({
  selector: 'app-submit-proof',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">Submit Milestone Proof</h1>
      <p class="page-subtitle">Upload proof details (photo / invoice) for manager review</p>
    </div>

    <div class="max-w-2xl">
      @if (milestones().length === 0 && !loading()) {
        <div class="card text-center py-10 text-slate-500">No milestones in progress to submit proof for.</div>
      } @else {
        <div class="card mb-4">
          <label class="form-label">Select Milestone</label>
          <select class="form-select" (change)="selectMilestone($event)">
            <option value="">Choose a milestone…</option>
            @for (m of milestones(); track m.milestoneId) {
              <option [value]="m.milestoneId">
                M{{ m.phaseNumber }} · {{ m.description }} — {{ inr(m.allocatedAmount) }}
              </option>
            }
          </select>
        </div>

        @if (selected()) {
          <div class="card">
            <h2 class="text-base font-semibold text-slate-900 mb-4">
              Submit proof — Milestone {{ selected()!.phaseNumber }}
              <span class="text-sm font-normal text-slate-500 ml-1">{{ selected()!.description }}</span>
            </h2>

            @if (success()) {
              <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4 text-emerald-700 text-sm">
                ✅ Status changes to PROOF_SUBMITTED; the manager is notified.
              </div>
            }
            @if (error()) { <div class="warning-bar mb-4">⚠️ {{ error() }}</div> }

            <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Proof Type</label>
                  <select formControlName="proofType" class="form-select">
                    <option value="PHOTO">Photo</option>
                    <option value="INVOICE">Invoice</option>
                    <option value="RECEIPT">Receipt</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label class="form-label">File Name</label>
                  <input formControlName="fileName" class="form-input" placeholder="e.g. renovation_photo.jpg">
                  @if (form.get('fileName')?.invalid && form.get('fileName')?.touched) {
                    <p class="form-error">File name required</p>
                  }
                </div>
              </div>

              <div>
                <label class="form-label">File URL / Link</label>
                <input formControlName="fileUrl" class="form-input" placeholder="https://drive.google.com/... or file path">
                @if (form.get('fileUrl')?.invalid && form.get('fileUrl')?.touched) {
                  <p class="form-error">File URL required</p>
                }
              </div>

              <div>
                <label class="form-label">Description / Note to manager</label>
                <textarea formControlName="description" class="form-input min-h-[80px] resize-none"
                          placeholder="What was completed in this phase…"></textarea>
              </div>

              <div class="info-bar text-xs">
                ℹ️ Status changes to PROOF_SUBMITTED after submission. The manager is notified.
              </div>

              <button type="submit" [disabled]="loading() || success()" class="btn-primary">
                @if (loading()) { <span class="spinner w-4 h-4"></span> }
                Submit for review
              </button>
            </form>
          </div>
        }
      }
    </div>
  `
})
export class SubmitProofComponent implements OnInit {
  form: FormGroup;
  milestones = signal<MilestoneResponse[]>([]);
  selected = signal<MilestoneResponse | null>(null);
  loading = signal(false);
  error = signal('');
  success = signal(false);
  private loanId: number | null = null;

  constructor(private fb: FormBuilder, private mSvc: MilestoneService,
              private loanSvc: LoanService, private auth: AuthService) {
    this.form = this.fb.group({
      proofType:   ['PHOTO',  Validators.required],
      fileName:    ['',       Validators.required],
      fileUrl:     ['',       Validators.required],
      description: ['']
    });
  }

  ngOnInit() {
    const uid = this.auth.currentUser()?.id;
    if (!uid) return;
    this.loanSvc.getLoansByBorrower(uid).subscribe(res => {
      const loan = res.data?.find((l: LoanResponse) =>
        ['SANCTIONED', 'ACTIVE', 'MORATORIUM'].includes(l.status));
      if (!loan) return;
      this.loanId = loan.loanId;
      this.mSvc.getMilestonesByLoan(loan.loanId).subscribe(r => {
        this.milestones.set((r.data ?? []).filter((m: MilestoneResponse) =>
          ['IN_PROGRESS', 'PENDING', 'PARTIALLY_APPROVED'].includes(m.status)));
      });
    });
  }

  selectMilestone(e: Event) {
    const id = +(e.target as HTMLSelectElement).value;
    this.selected.set(this.milestones().find(m => m.milestoneId === id) ?? null);
    this.success.set(false);
  }

  submit() {
    if (this.form.invalid || !this.selected() || !this.loanId) {
      this.form.markAllAsTouched(); return;
    }
    const uid = this.auth.currentUser()!.id;
    this.loading.set(true); this.error.set('');
    this.mSvc.submitProof(this.selected()!.milestoneId, {
      milestoneId:   this.selected()!.milestoneId,
      loanId:        this.loanId!,
      submittedById: uid,
      proofType:     this.form.value.proofType as ProofType,
      fileName:      this.form.value.fileName,
      fileUrl:       this.form.value.fileUrl,
      description:   this.form.value.description
    }).subscribe({
      next: () => { this.success.set(true); this.loading.set(false); this.form.reset({ proofType: 'PHOTO' }); },
      error: e => { this.error.set(e.error?.message ?? 'Submission failed'); this.loading.set(false); }
    });
  }

  inr(v: number) { return '₹' + (v ?? 0).toLocaleString('en-IN'); }
}
