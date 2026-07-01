import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    @keyframes slide-in {
      from { transform: translateX(110%); opacity: 0; }
      to   { transform: translateX(0);   opacity: 1; }
    }
    .toast-enter { animation: slide-in 0.3s ease-out forwards; }
  `],
  template: `
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-80 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-enter pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border
                    {{ colorClass(toast.type) }}"
             role="alert">
          <span class="text-lg shrink-0 mt-0.5">{{ icon(toast.type) }}</span>
          <p class="flex-1 text-sm font-medium leading-snug">{{ toast.message }}</p>
          <button (click)="toastService.dismiss(toast.id)"
                  class="shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity" aria-label="Dismiss">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  toastService = inject(ToastService);

  icon(type: Toast['type']): string {
    return { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }[type];
  }

  colorClass(type: Toast['type']): string {
    return {
      success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      error:   'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-amber-50 border-amber-200 text-amber-800',
      info:    'bg-blue-50 border-blue-200 text-blue-800',
    }[type];
  }
}
