import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
      <p class="page-subtitle">Approve or reject milestone-borrow requests</p>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16"><span class="spinner w-8 h-8"></span></div>
    } @else if (pending().length === 0) {
      <div class="card text-center py-12">
        <div class="text-4xl mb-3">✅</div>
        <p class="text-slate-500">No pending emergency requests</p>
      </div>
    } @else {
      <div class="space-y-4 max-w-2xl">
        @for (req of pending(); track req.id) {
          <div class="card">
            <h2 class="text-base font-semibold text-slate-900 mb-4">Review milestone top-up request</h2>
            <dl class="space-y-2 text-sm mb-4">
              <div class="flex justify-between"><dt class="text-slate-500">Amount</dt><dd class="font-semibold">{{ inr(req.amount) }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Type</dt><dd>{{ req.type }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Reason</dt><dd>{{ req.reason || '—' }}</dd></div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Proof</dt>
                <dd><span class="badge-slate badge">Not provided</span></dd>
              </div>
            </dl>

            @if (outcomes().get(req.id)) {
              <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-700 text-sm mb-3">
                ✅ {{ outcomes().get(req.id) }}
              </div>
            }

            <div>
              <label class="form-label">Manager remarks</label>
              <input [id]="'remarks-' + req.id" class="form-input mb-3" placeholder="Optional remarks…">
            </div>

            <div class="flex gap-3">
              <button class="btn-success flex-1" [disabled]="actioning() === req.id"
                      (click)="decide(req, true)">
                @if (actioning() === req.id && lastDecision() === 'approve') { <span class="spinner w-4 h-4"></span> }
                Approve
              </button>
              <button class="btn-secondary border-red-200 text-red-600 hover:bg-red-50"
                      [disabled]="actioning() === req.id" (click)="decide(req, false)">
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
  pending = signal<EmergencyTransactionResponse[]>([]);
  outcomes = signal<Map<number, string>>(new Map());
  loading = signal(true);
  actioning = signal<number | null>(null);
  lastDecision = signal<string>('');

  constructor(private eSvc: EmergencyService, private auth: AuthService, private fb: FormBuilder) {}

  ngOnInit() {
    this.eSvc.getPending().subscribe({
      next: res => { this.pending.set(res.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  decide(req: EmergencyTransactionResponse, approve: boolean) {
    const managerId = this.auth.currentUser()!.id;
    const remarksEl = document.getElementById(`remarks-${req.id}`) as HTMLInputElement;
    const remarks = remarksEl?.value ?? '';
    this.actioning.set(req.id);
    this.lastDecision.set(approve ? 'approve' : 'reject');
    const call = approve
      ? this.eSvc.approve(req.id, managerId, remarks)
      : this.eSvc.reject(req.id, managerId, remarks);
    call.subscribe({
      next: () => {
        this.outcomes.update(m => { m.set(req.id, approve ? 'Approved — funds released.' : 'Rejected.'); return new Map(m); });
        this.actioning.set(null);
      },
      error: () => this.actioning.set(null)
    });
  }

  inr(v: number) { return '₹' + (v ?? 0).toLocaleString('en-IN'); }
}
