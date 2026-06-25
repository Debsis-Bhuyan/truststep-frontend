import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MilestoneService } from '../../../core/services/milestone.service';
import { LoanService } from '../../../core/services/loan.service';
import { AuthService } from '../../../core/services/auth.service';
import { MilestoneResponse } from '../../../core/models/milestone.model';

@Component({
  selector: 'app-submit-proof',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">Submit Milestone Proof</h1>
      <p class="page-subtitle">Upload proof (photos, invoices) before manager review</p>
    </div>

    <div class="max-w-2xl">
      @if (milestones().length === 0 && !loading()) {
        <div class="card text-center py-10 text-slate-500">No milestones in progress.</div>
      } @else {
        <!-- Select milestone -->
        <div class="card mb-4">
          <label class="form-label">Select Milestone</label>
          <select class="form-select" (change)="selectMilestone($event)">
            <option value="">Choose a milestone…</option>
            @for (m of milestones(); track m.id) {
              <option [value]="m.id">M{{ m.sequenceNumber }} · {{ m.description }} — {{ inr(m.amount) }}</option>
            }
          </select>
        </div>

        @if (selected()) {
          <div class="card">
            <h2 class="text-base font-semibold text-slate-900 mb-4">
              Submit proof — Milestone {{ selected()!.sequenceNumber }}
              <span class="text-sm font-normal text-slate-500 ml-1">{{ selected()!.description }}</span>
            </h2>

            @if (success()) {
              <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4 text-emerald-700 text-sm">
                ✅ Status changes to PROOF_SUBMITTED; the manager is notified.
              </div>
            }
            @if (error()) { <div class="warning-bar mb-4">⚠️ {{ error() }}</div> }

            <form [formGroup]="form" (ngSubmit)="submit()">
              <div class="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Photo</p>
                  <div class="drop-zone" (click)="photoInput.click()"
                       (dragover)="$event.preventDefault()" (drop)="onDrop($event, 'photo')">
                    @if (photo) {
                      <p class="text-sm text-primary-700">📷 {{ photo.name }}</p>
                    } @else {
                      <p class="text-sm text-slate-400">Drop image</p>
                    }
                    <input #photoInput type="file" class="hidden" accept="image/*" (change)="onFile($event, 'photo')">
                  </div>
                </div>
                <div>
                  <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Invoice / Receipt</p>
                  <div class="drop-zone" (click)="invoiceInput.click()"
                       (dragover)="$event.preventDefault()" (drop)="onDrop($event, 'invoice')">
                    @if (invoice) {
                      <p class="text-sm text-primary-700">📄 {{ invoice.name }}</p>
                    } @else {
                      <p class="text-sm text-slate-400">Drop file</p>
                    }
                    <input #invoiceInput type="file" class="hidden" accept=".pdf,.jpg,.png" (change)="onFile($event, 'invoice')">
                  </div>
                </div>
              </div>

              <div class="mb-4">
                <label class="form-label">Note to manager</label>
                <textarea formControlName="noteToManager" class="form-input min-h-[80px] resize-none"
                          placeholder="What was completed in this phase…"></textarea>
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
  photo: File | null = null;
  invoice: File | null = null;
  private loanId: number | null = null;

  constructor(private fb: FormBuilder, private mSvc: MilestoneService,
              private loanSvc: LoanService, private auth: AuthService) {
    this.form = this.fb.group({ noteToManager: [''] });
  }

  ngOnInit() {
    const uid = this.auth.currentUser()?.id;
    if (!uid) return;
    this.loanSvc.getLoansByBorrower(uid).subscribe(res => {
      const loan = res.data?.find((l: any) => ['SANCTIONED', 'ACTIVE', 'MORATORIUM'].includes(l.status));
      if (!loan) return;
      this.loanId = loan.id;
      this.mSvc.getMilestonesByLoan(loan.id).subscribe(r => {
        this.milestones.set((r.data ?? []).filter((m: any) => ['IN_PROGRESS', 'PENDING'].includes(m.status)));
      });
    });
  }

  selectMilestone(e: Event) {
    const id = +(e.target as HTMLSelectElement).value;
    this.selected.set(this.milestones().find(m => m.id === id) ?? null);
    this.success.set(false);
  }

  onFile(e: Event, type: 'photo' | 'invoice') {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (type === 'photo') this.photo = f ?? null;
    else this.invoice = f ?? null;
  }

  onDrop(e: DragEvent, type: 'photo' | 'invoice') {
    e.preventDefault();
    const f = e.dataTransfer?.files[0];
    if (type === 'photo') this.photo = f ?? null;
    else this.invoice = f ?? null;
  }

  submit() {
    if (!this.selected()) return;
    this.loading.set(true);
    this.error.set('');
    const fd = new FormData();
    if (this.photo) fd.append('photo', this.photo);
    if (this.invoice) fd.append('invoice', this.invoice);
    fd.append('noteToManager', this.form.value.noteToManager ?? '');
    this.mSvc.submitProof(this.selected()!.id, fd).subscribe({
      next: () => { this.success.set(true); this.loading.set(false); },
      error: e => { this.error.set(e.error?.message ?? 'Submission failed'); this.loading.set(false); }
    });
  }

  inr(v: number) { return '₹' + (v ?? 0).toLocaleString('en-IN'); }
}
