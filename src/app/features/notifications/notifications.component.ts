import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationResponse } from '../../core/models/notification.model';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header flex items-center justify-between">
      <div>
        <h1 class="page-title">Notifications</h1>
        @if (unreadCount() > 0) {
          <p class="page-subtitle">{{ unreadCount() }} unread</p>
        }
      </div>
      @if (unreadCount() > 0) {
        <button class="btn-secondary text-sm" (click)="markAllRead()">Mark all as read</button>
      }
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16">
        <span class="spinner w-8 h-8"></span>
      </div>
    } @else if (notifications().length === 0) {
      <div class="card text-center py-12">
        <div class="text-4xl mb-3">🔔</div>
        <p class="text-slate-500">No notifications yet</p>
      </div>
    } @else {
      <div class="space-y-2">
        @for (n of notifications(); track n.id) {
          <div [class]="n.isRead ? 'bg-white' : 'bg-blue-50 border-blue-200'"
               class="flex items-start gap-4 p-4 rounded-xl border border-slate-200 cursor-pointer hover:shadow-card-hover transition-shadow"
               (click)="markRead(n)">
            <div [class]="badgeClass(n.type)"
                 class="badge shrink-0 mt-0.5">{{ n.type }}</div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-900">{{ n.title }}</p>
              <p class="text-sm text-slate-500 mt-0.5">{{ n.message }}</p>
            </div>
            <span class="text-xs text-slate-400 shrink-0">{{ timeAgo(n.createdAt) }}</span>
          </div>
        }
      </div>
    }
  `
})
export class NotificationsComponent implements OnInit {
  notifications = signal<NotificationResponse[]>([]);
  loading = signal(true);
  unreadCount = signal(0);

  constructor(private svc: NotificationService) {}

  ngOnInit() {
    this.svc.getMyNotifications().subscribe({
      next: res => {
        this.notifications.set(res.data?.content ?? []);
        this.unreadCount.set((res.data?.content ?? []).filter((n: NotificationResponse) => !n.isRead).length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  markRead(n: NotificationResponse) {
    if (n.isRead) return;
    this.svc.markRead(n.id).subscribe(() => {
      this.notifications.update(list => list.map(x => x.id === n.id ? { ...x, isRead: true } : x));
      this.unreadCount.update(c => Math.max(0, c - 1));
    });
  }

  markAllRead() {
    this.svc.markAllRead().subscribe(() => {
      this.notifications.update(list => list.map(x => ({ ...x, isRead: true })));
      this.unreadCount.set(0);
    });
  }

  badgeClass(type: string) {
    const map: Record<string, string> = {
      NEW: 'badge-green', EMI: 'badge-amber', INFO: 'badge-blue', ALERT: 'badge-red'
    };
    return map[type] ?? 'badge-slate';
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }
}
