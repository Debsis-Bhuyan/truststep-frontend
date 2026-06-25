import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LoanService } from '../../../core/services/loan.service';
import { AuthService } from '../../../core/services/auth.service';
import { DocumentService } from '../../../core/services/document.service';
import { LoanResponse } from '../../../core/models/loan.model';
import { LoanDocumentResponse } from '../../../core/models/document.model';

@Component({
  selector: 'app-review-sanction',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="text-sm text-slate-400 mb-4">Loans / {{ loan()?.loanNumber }} / Review</div>

    <div class="page-header">
      <h1 class="page-title">Review & Sanction Loan</h1>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16"><span class="spinner w-8 h-8"></span></div>
    } @else if (!loan()) {
      <div class="card text-center py-10 text-slate-500">Loan not found.</div>
    } @else {
      <div class="max-w-4xl grid sm:grid-cols-2 gap-4">
        <!-- Application -->
        <div class="card">
          <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Application</h2>
          <dl class="space-y-2.5 text-sm">
            <div class="flex justify-between"><dt class="text-slate-500">Borrower</dt><dd class="font-medium">{{ loan()!.borrowerName }}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-500">Amount</dt><dd class="font-medium">{{ inr(loan()!.loanAmount) }}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-500">Purpose</dt><dd class="font-medium">{{ loan()!.purpose }}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-500">Tenure</dt><dd class="font-medium">{{ loan()!.tenureMonths }} months</dd></div>
          </dl>
        </div>

        <!-- KYC Docs -->
        <div class="card">
          <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">KYC Documents</h2>
          <div class="space-y-2">
            @for (d of docs(); track d.id) {
              <div class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span class="text-sm text-slate-700">{{ d.docType }}</span>
                <div class="flex items-center gap-2">
                  <span [class]="d.status === 'VERIFIED' ? 'badge-green' : 'badge-amber'" class="badge text-xs">{{ d.status }}</span>
                  <a [href]="d.fileUrl" target="_blank" class="text-xs text-primary-600 hover:underline">View</a>
                </div>
              </div>
            }
            @if (docs().length === 0) {
              <p class="text-sm text-slate-400">No documents uploaded yet.</p>
            }
          </div>
          <p class="text-xs text-slate-400 mt-3 info-bar">ℹ️ PAN unmask is logged in the audit trail.</p>
        </div>
      </div>

      <!-- On sanction preview -->
      <div class="max-w-4xl mt-4">
        <div class="card bg-primary-50 border-primary-100">
          <h2 class="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-2">On Sanction</h2>
          <div class="flex gap-6 text-sm">
            <div>
              <p class="text-slate-500">Milestone fund (80%)</p>
              <p class="text-xl font-bold text-primary-800">{{ inr(loan()!.loanAmount * 0.8) }}</p>
            </div>
            <div>
              <p class="text-slate-500">Emergency fund (20%)</p>
              <p class="text-xl font-bold text-emerald-700">{{ inr(loan()!.loanAmount * 0.2) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Sanction form -->
      <div class="max-w-4xl mt-4">
        <div class="card">
          @if (msg()) { <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4 text-emerald-700 text-sm">✅ {{ msg() }}</div> }
          @if (error()) { <div class="warning-bar mb-4">⚠️ {{ error() }}</div> }

          <form [formGroup]="form" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">Interest rate (%)</label>
                <input formControlName="interestRate" type="number" class="form-input" placeholder="11.5">
              </div>
              <div>
                <label class="form-label">Tenure (months)</label>
                <input formControlName="tenureMonths" type="number" class="form-input">
              </div>
            </div>
            <div>
              <label class="form-label">Remarks</label>
              <textarea formControlName="remarks" class="form-input resize-none min-h-[60px]" placeholder="Optional remarks…"></textarea>
            </div>

            <div class="flex gap-3">
              <button type="button" class="btn-success flex-1" [disabled]="actioning()" (click)="sanction()">
                @if (actioning() === 'sanction') { <span class="spinner w-4 h-4"></span> }
                Sanction loan
              </button>
              <button type="button" class="btn-danger" [disabled]="actioning()" (click)="reject()">
                @if (actioning() === 'reject') { <span class="spinner w-4 h-4"></span> }
                Reject
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class ReviewSanctionComponent implements OnInit {
  form: FormGroup;
  loan = signal<LoanResponse | null>(null);
  docs = signal<LoanDocumentResponse[]>([]);
  loading = signal(true);
  actioning = signal<string | null>(null);
  msg = signal('');
  error = signal('');
  private loanId = 0;

  constructor(private fb: FormBuilder, private loanSvc: LoanService,
              private docSvc: DocumentService, private auth: AuthService,
              private route: ActivatedRoute, private router: Router) {
    this.form = this.fb.group({
      interestRate:  [11.5, [Validators.required, Validators.min(0)]],
      tenureMonths:  [24,   [Validators.required, Validators.min(1)]],
      remarks:       ['']
    });
  }

  ngOnInit() {
    this.loanId = +this.route.snapshot.paramMap.get('id')!;
    this.loanSvc.getLoanById(this.loanId).subscribe({
      next: res => {
        this.loan.set(res.data);
        this.form.patchValue({ tenureMonths: res.data.tenureMonths });
        this.docSvc.getByLoan(this.loanId).subscribe(r => { this.docs.set(r.data ?? []); });
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  sanction() {
    if (this.form.invalid) return;
    this.actioning.set('sanction');
    const managerId = this.auth.currentUser()!.id;
    this.loanSvc.sanctionLoan(this.loanId, managerId, this.form.value).subscribe({
      next: () => { this.msg.set('Loan sanctioned successfully!'); this.actioning.set(null); },
      error: e => { this.error.set(e.error?.message ?? 'Sanction failed'); this.actioning.set(null); }
    });
  }

  reject() {
    const reason = this.form.value.remarks || 'Rejected by manager';
    this.actioning.set('reject');
    this.loanSvc.rejectLoan(this.loanId, reason).subscribe({
      next: () => { this.msg.set('Loan rejected.'); this.actioning.set(null); },
      error: e => { this.error.set(e.error?.message ?? 'Reject failed'); this.actioning.set(null); }
    });
  }

  inr(v: number) { return '₹' + (v ?? 0).toLocaleString('en-IN'); }
}
