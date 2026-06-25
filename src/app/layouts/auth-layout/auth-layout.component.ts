import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-white tracking-tight">TrustStep</h1>
          <p class="text-primary-200 text-sm mt-1">Milestone-Based MSME Loans</p>
        </div>
        <div class="bg-white rounded-2xl shadow-2xl p-8">
          <router-outlet />
        </div>
      </div>
    </div>
  `
})
export class AuthLayoutComponent {}
