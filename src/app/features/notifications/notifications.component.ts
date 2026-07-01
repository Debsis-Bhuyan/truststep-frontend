import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationResponse, NotifType } from '../../core/models/notification.model';

type FilterTab = 'ALL' | 'UNREAD' | NotifType;

interface NotifGroup { label: string; items: NotificationResponse[]; }

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .notif-item { transition: background .15s, box-shadow .15s; }
    .notif-item:hover { background: #f8fafc; }
    .notif-unread { background: #eff6ff; border-left: 3px solid #3b82f6; }
    .notif-unread:hover { background: #dbeafe; }
    .tab-btn {
      padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 500;
      border: 1px solid #e2e8f0; background: white; color: #64748b;
      cursor: pointer; transition: all .15s; white-space: nowrap;
    }
    .tab-btn:hover { border-color: #3b82f6; color: #3b82f6; }
    .tab-btn.active { background: #3b82f6; border-color: #3b82f6; color: white; }
    .mark-read-btn {
      opacity: 0; font-size: 11px; padding: 3px 8px; border-radius: 4px;
      border: 1px solid #93c5fd; color: #3b82f6; background: white;
      cursor: pointer; transition: opacity .15s, background .1s;
    }
    .notif-item:hover .mark-read-btn { opacity: 1; }
    .mark-read-btn:hover { background: #eff6ff; }
  `],
  template: `
    <!-- Page header -->
    <div class="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5
                 a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436
                 L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
        </div>
        <div>
          <h1 class="page-title">Notifications</h1>
          <p class="page-subtitle">
            @if (unreadCount() > 0) {
              <span class="text-primary-600 font-medium">{{ unreadCount() }} unread</span>
              &nbsp;·&nbsp; {{ all().length }} total
            } @else {
              {{ all().length > 0 ? (all().length + ' notifications') : 'No notifications yet' }}
            }
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        @if (unreadCount() > 0) {
          <button class="btn-secondary text-sm" (click)="markAllRead()">
            <svg class="w-4 h-4 inline mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Mark all read
          </button>
        }
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="flex items-center gap-2 flex-wrap mb-5 overflow-x-auto pb-1">
      <button class="tab-btn" [class.active]="activeTab() === 'ALL'"    (click)="setTab('ALL')">
        All <span class="ml-1 text-xs opacity-70">{{ all().length }}</span>
      </button>
      <button class="tab-btn" [class.active]="activeTab() === 'UNREAD'" (click)="setTab('UNREAD')">
        Unread
        @if (unreadCount() > 0) {
          <span class="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-xs
                        bg-primary-500 text-white">{{ unreadCount() }}</span>
        }
      </button>
      @for (t of typeTabs; track t.value) {
        @if (countByType(t.value) > 0) {
          <button class="tab-btn" [class.active]="activeTab() === t.value" (click)="setTab(t.value)">
            {{ t.icon }} {{ t.label }}
            <span class="ml-1 text-xs opacity-70">{{ countByType(t.value) }}</span>
          </button>
        }
      }
    </div>

    @if (loading()) {
      <!-- Skeleton -->
      <div class="space-y-3">
        @for (i of [1,2,3,4]; track i) {
          <div class="card animate-pulse">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-slate-200 shrink-0"></div>
              <div class="flex-1 space-y-2">
                <div class="h-3.5 bg-slate-200 rounded w-1/3"></div>
                <div class="h-3 bg-slate-100 rounded w-2/3"></div>
              </div>
              <div class="w-12 h-3 bg-slate-200 rounded shrink-0"></div>
            </div>
          </div>
        }
      </div>

    } @else if (filtered().length === 0) {
      <!-- Empty state -->
      <div class="card flex flex-col items-center justify-center py-16 text-center">
        <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5
                 a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436
                 L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
        </div>
        <p class="text-slate-700 font-medium mb-1">
          {{ activeTab() === 'UNREAD' ? 'All caught up!' : 'No notifications' }}
        </p>
        <p class="text-sm text-slate-400">
          {{ activeTab() === 'UNREAD' ? 'No unread notifications at the moment.' : 'You have no notifications yet.' }}
        </p>
      </div>

    } @else {
      <!-- Grouped list -->
      <div class="space-y-6">
        @for (group of groups(); track group.label) {
          <section>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
              {{ group.label }}
            </p>
            <div class="card !p-0 overflow-hidden divide-y divide-slate-100">
              @for (n of group.items; track n.id) {
                <div class="notif-item flex items-start gap-4 px-4 py-4 cursor-pointer"
                     [class.notif-unread]="!n.isRead"
                     (click)="markRead(n)">
                  <!-- Type icon -->
                  <div [class]="typeIconBg(n.type)"
                       class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <svg class="w-5 h-5" [class]="typeIconColor(n.type)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      @switch (n.type) {
                        @case ('NEW') {
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                        }
                        @case ('EMI') {
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                        }
                        @case ('ALERT') {
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4
                               c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                        }
                        @default {
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        }
                      }
                    </svg>
                  </div>

                  <!-- Content -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-3">
                      <p class="text-sm leading-snug" [class]="n.isRead ? 'text-slate-700' : 'font-semibold text-slate-900'">
                        {{ n.title }}
                      </p>
                      <div class="flex items-center gap-2 shrink-0">
                        @if (!n.isRead) {
                          <button class="mark-read-btn" (click)="markRead(n); $event.stopPropagation()">
                            Mark read
                          </button>
                          <div class="w-2 h-2 rounded-full bg-primary-500 shrink-0"></div>
                        }
                        <span class="text-xs text-slate-400 whitespace-nowrap">{{ timeAgo(n.createdAt) }}</span>
                      </div>
                    </div>
                    <p class="text-sm text-slate-500 mt-0.5 leading-snug">{{ n.message }}</p>
                    <div class="flex items-center gap-2 mt-1.5">
                      <span [class]="typePillClass(n.type)"
                            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
                        {{ typeLabel(n.type) }}
                      </span>
                      <span class="text-xs text-slate-300">{{ n.createdAt | date:'dd MMM yyyy, h:mm a' }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </section>
        }
      </div>
    }
  `
})
export class NotificationsComponent implements OnInit {
  all         = signal<NotificationResponse[]>([]);
  loading     = signal(true);
  unreadCount = signal(0);
  activeTab   = signal<FilterTab>('ALL');

  readonly typeTabs: { value: NotifType; label: string; icon: string }[] = [
    { value: 'NEW',   label: 'New',   icon: '✨' },
    { value: 'EMI',   label: 'EMI',   icon: '💳' },
    { value: 'INFO',  label: 'Info',  icon: 'ℹ️' },
    { value: 'ALERT', label: 'Alert', icon: '⚠️' },
  ];

  filtered = computed(() => {
    const tab = this.activeTab();
    const list = this.all();
    if (tab === 'ALL')    return list;
    if (tab === 'UNREAD') return list.filter(n => !n.isRead);
    return list.filter(n => n.type === tab);
  });

  groups = computed((): NotifGroup[] => {
    const now  = new Date();
    const today     = this.startOf(now, 0);
    const yesterday = this.startOf(now, 1);
    const thisWeek  = this.startOf(now, 7);

    const buckets: { label: string; items: NotificationResponse[] }[] = [
      { label: 'Today',     items: [] },
      { label: 'Yesterday', items: [] },
      { label: 'This week', items: [] },
      { label: 'Earlier',   items: [] },
    ];

    for (const n of this.filtered()) {
      const d = new Date(n.createdAt).getTime();
      if (d >= today)     buckets[0].items.push(n);
      else if (d >= yesterday) buckets[1].items.push(n);
      else if (d >= thisWeek)  buckets[2].items.push(n);
      else                     buckets[3].items.push(n);
    }

    return buckets.filter(b => b.items.length > 0);
  });

  constructor(private svc: NotificationService) {}

  ngOnInit() {
    this.svc.getMyNotifications().subscribe({
      next: res => {
        const list = res.data?.content ?? [];
        this.all.set(list);
        this.unreadCount.set(list.filter(n => !n.isRead).length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setTab(tab: FilterTab) { this.activeTab.set(tab); }

  countByType(type: NotifType) { return this.all().filter(n => n.type === type).length; }

  markRead(n: NotificationResponse) {
    if (n.isRead) return;
    this.svc.markRead(n.id).subscribe(() => {
      this.all.update(list => list.map(x => x.id === n.id ? { ...x, isRead: true } : x));
      this.unreadCount.update(c => Math.max(0, c - 1));
    });
  }

  markAllRead() {
    this.svc.markAllRead().subscribe(() => {
      this.all.update(list => list.map(x => ({ ...x, isRead: true })));
      this.unreadCount.set(0);
    });
  }

  typeIconBg(type: NotifType) {
    return { NEW: 'bg-green-100', EMI: 'bg-amber-100', INFO: 'bg-blue-100', ALERT: 'bg-red-100' }[type] ?? 'bg-slate-100';
  }

  typeIconColor(type: NotifType) {
    return { NEW: 'text-green-600', EMI: 'text-amber-600', INFO: 'text-blue-600', ALERT: 'text-red-600' }[type] ?? 'text-slate-500';
  }

  typePillClass(type: NotifType) {
    return {
      NEW:   'bg-green-100 text-green-700',
      EMI:   'bg-amber-100 text-amber-700',
      INFO:  'bg-blue-100 text-blue-700',
      ALERT: 'bg-red-100 text-red-700',
    }[type] ?? 'bg-slate-100 text-slate-600';
  }

  typeLabel(type: NotifType) {
    return { NEW: 'New', EMI: 'EMI', INFO: 'Info', ALERT: 'Alert' }[type] ?? type;
  }

  timeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7)  return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  private startOf(now: Date, daysBack: number): number {
    const d = new Date(now);
    d.setDate(d.getDate() - daysBack);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
}
