import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AuditLogResponse } from '../../../core/models/admin.model';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">Audit Log</h1>
      <p class="page-subtitle">Immutable trail of all changes · filter by user, table, action, date</p>
    </div>

    <div class="card mb-4">
      <div class="flex flex-wrap gap-3 items-center">
        <select [(ngModel)]="actionFilter" (ngModelChange)="filter()" class="form-select w-44">
          <option value="">Action ▼</option>
          <option value="INSERT">INSERT</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="VIEW_SENSITIVE">VIEW_SENSITIVE</option>
        </select>
        <input [(ngModel)]="tableFilter" (ngModelChange)="filter()" class="form-input w-44"
               placeholder="Table name…">
        <button class="btn-primary" (click)="load()">Refresh</button>
      </div>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16"><span class="spinner w-8 h-8"></span></div>
    } @else {
      <div class="table-wrapper">
        <table class="ts-table">
          <thead><tr>
            <th>Time</th><th>User</th><th>Table</th><th>Record</th><th>Action</th><th>IP</th>
          </tr></thead>
          <tbody>
            @for (log of displayed(); track log.logId) {
              <tr>
                <td class="text-xs text-slate-500 whitespace-nowrap">{{ fmtTime(log.changedAt) }}</td>
                <td class="font-medium">{{ log.changedByName || '—' }}</td>
                <td class="font-mono text-xs text-slate-600">{{ log.tableName }}</td>
                <td class="text-xs text-slate-400">{{ log.recordId }}</td>
                <td><span [class]="actionBadge(log.action)" class="badge text-xs">{{ log.action }}</span></td>
                <td class="font-mono text-xs text-slate-400">{{ log.ipAddress || '—' }}</td>
              </tr>
            }
            @empty {
              <tr><td colspan="6" class="text-center py-10 text-slate-400">No audit records found</td></tr>
            }
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between mt-4 text-sm text-slate-500">
        <span>Page {{ page + 1 }} of {{ totalPages }}</span>
        <div class="flex gap-2">
          <button class="btn-secondary text-xs py-1.5" [disabled]="page === 0" (click)="prevPage()">Previous</button>
          <button class="btn-secondary text-xs py-1.5" [disabled]="page >= totalPages - 1" (click)="nextPage()">Next</button>
        </div>
      </div>

      <div class="info-bar mt-4 text-xs">
        ℹ️ Records are append-only; UPDATE / DELETE are blocked by database triggers.
      </div>
    }
  `
})
export class AuditLogComponent implements OnInit {
  logs      = signal<AuditLogResponse[]>([]);
  displayed = signal<AuditLogResponse[]>([]);
  loading   = signal(true);
  actionFilter = '';
  tableFilter  = '';
  page = 0;
  totalPages = 1;

  constructor(private svc: AdminService) {}

  ngOnInit() { this.load(); }
  prevPage() { this.page--; this.load(); }
  nextPage() { this.page++; this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getAuditLogs(this.page, 20).subscribe({
      next: res => {
        this.logs.set(res.data?.content ?? []);
        this.totalPages = res.data?.totalPages ?? 1;
        this.filter();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filter() {
    let list = this.logs();
    if (this.actionFilter) list = list.filter(l => l.action === this.actionFilter);
    if (this.tableFilter)  list = list.filter(l => l.tableName?.toLowerCase().includes(this.tableFilter.toLowerCase()));
    this.displayed.set(list);
  }

  actionBadge(a: string) {
    return { INSERT: 'badge-green', UPDATE: 'badge-amber', DELETE: 'badge-red', VIEW_SENSITIVE: 'badge-purple' }[a] ?? 'badge-slate';
  }

  fmtTime(d: string) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: '2-digit' });
  }
}
