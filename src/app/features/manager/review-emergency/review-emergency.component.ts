import { Component, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EmergencyService } from '../../../core/services/emergency.service';
import { AuthService } from '../../../core/services/auth.service';
import { EmergencyTransactionResponse } from '../../../core/models/emergency.model';

@Component({
  selector: 'app-review-emergency',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">Review Emergency / Top-up</h1>
      <p class="page-subtitle">Approve or reject milestone-borrow requests · proof optional</p>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16"><span class="spinner w-8 h-8"></span></div>
    } @else if (pending().length === 0) {
      <div class="card text-center py-12">
        <div class="text-4xl mb-3">✅</div>
        <p class="text-slate-500">No pending emergency / top-up requests</p>
      </div>
    } @else {
      <div class="space-y-4 max-w-2xl">
        @for (req of pending(); track req.emergencyId) {
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-base font-semibold text-slate-900">Emergency / Top-up Request</h2>
              <span [class]="priorityBadge(req.priority)" class="badge">{{ req.priority }}</span>
            </div>

            <dl class="space-y-2 text-sm mb-4">
              <div class="flex justify-between"><dt class="text-slate-500">Borrower</dt><dd class="font-medium">{{ req.requestedByName }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Amount requested</dt><dd class="font-semibold text-primary-700">{{ inr(req.amountRequested) }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Type</dt><dd>{{ req.emergencyType || req.accessType }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Access</dt><dd>{{ req.accessType }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Reason</dt><dd class="max-w-48 text-right">{{ req.reason }}</dd></div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Proof</dt>
                <dd>
                  @if (req.proofUrl) {
                    <a [href]="req.proofUrl" target="_blank" class="text-primary-600 text-xs hover:underline">View proof</a>
                  } @else {
                    <span class="badge-slate badge text-xs">Not provided</span>
                  }
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Requested</dt>
                <dd class="text-xs text-slate-400">{{ fmtDate(req.requestedAt) }}</dd>
              </div>
            </dl>

            @if (outcomes().get(req.emergencyId)) {
              <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-700 text-sm mb-3">
                ✅ {{ outcomes().get(req.emergencyId) }}
              </div>
            }

            <div class="mb-3">
              <label class="form-label text-xs">Manager remarks</label>
              <input [id]="'remarks-' + req.emergencyId" class="form-input text-sm" placeholder="Optional remarks…">
            </div>

            <div class="flex gap-3">
              <button class="btn-success flex-1" [disabled]="actioning() === req.emergencyId"
                      (click)="decide(req, 'APPROVED')">
                @if (actioning() === req.emergencyId && lastDecision() === 'APPROVED') {
                  <span class="spinner w-4 h-4"></span>
                }
                Approve
              </button>
              <button class="btn-danger" [disabled]="actioning() === req.emergencyId"
                      (click)="decide(req, 'REJECTED')">
                Reject
              </button>
            </div>

            <div class="info-bar mt-4 text-xs">
              ℹ️ Approval allowed with or without proof; decision is audited.
            </div>
          </div>
        }
      </div>
    }
  `
})
export class ReviewEmergencyComponent implements OnInit {
  pending     = signal<EmergencyTransactionResponse[]>([]);
  outcomes    = signal<Map<number, string>>(new Map());
  loading     = signal(true);
  actioning   = signal<number | null>(null);
  lastDecision = signal<string>('');

  constructor(private eSvc: EmergencyService, private auth: AuthService) {}

  ngOnInit() {
    this.eSvc.getByLoan(0).subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  decide(req: EmergencyTransactionResponse, decision: 'APPROVED' | 'REJECTED') {
    const remarksEl = document.getElementById(`remarks-${req.emergencyId}`) as HTMLInputElement;
    const remarks = remarksEl?.value ?? '';
    this.actioning.set(req.emergencyId);
    this.lastDecision.set(decision);
    this.eSvc.decide(req.emergencyId, decision, req.amountRequested, remarks).subscribe({
      next: () => {
        this.outcomes.update(m => {
          m.set(req.emergencyId, decision === 'APPROVED' ? `Approved — ₹${req.amountRequested} will be disbursed.` : 'Rejected.');
          return new Map(m);
        });
        this.pending.update(list => list.filter(r => r.emergencyId !== req.emergencyId));
        this.actioning.set(null);
      },
      error: () => this.actioning.set(null)
    });
  }

  priorityBadge(p: string) {
    return { LOW: 'badge-slate', MEDIUM: 'badge-blue', HIGH: 'badge-amber', CRITICAL: 'badge-red' }[p] ?? 'badge-slate';
  }

  inr(v: number) { return '₹' + (v ?? 0).toLocaleString('en-IN'); }
  fmtDate(d: string) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}
