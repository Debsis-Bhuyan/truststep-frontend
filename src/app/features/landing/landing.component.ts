import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <!-- ── NAVBAR ──────────────────────────────────────── -->
    <nav class="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-sm border-b border-slate-200">
      <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">TS</span>
          </div>
          <span class="font-bold text-slate-900 text-lg">TrustStep</span>
        </div>
        <div class="hidden md:flex items-center gap-6 text-sm text-slate-600">
          <a href="#features" class="hover:text-primary-600 transition-colors">Features</a>
          <a href="#how-it-works" class="hover:text-primary-600 transition-colors">How it works</a>
          <a href="#roles" class="hover:text-primary-600 transition-colors">Roles</a>
          <a href="#security" class="hover:text-primary-600 transition-colors">Security</a>
        </div>
        <div class="flex items-center gap-3">
          <a routerLink="/login" class="btn-secondary text-sm py-2">Sign in</a>
          <a routerLink="/register" class="btn-primary text-sm py-2">Get started</a>
        </div>
      </div>
    </nav>

    <!-- ── HERO ────────────────────────────────────────── -->
    <section class="pt-32 pb-20 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600">
      <div class="max-w-5xl mx-auto px-4 text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-primary-100 text-sm mb-6">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Milestone-Based MSME Loan Disbursement System
        </div>
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
          Smarter loans for<br class="hidden sm:block">
          <span class="text-primary-200">India's small businesses</span>
        </h1>
        <p class="text-lg sm:text-xl text-primary-200 max-w-2xl mx-auto mb-10">
          TrustStep disburses MSME loans in milestone-linked tranches —
          reducing risk for banks, ensuring accountability for borrowers,
          and releasing capital exactly when it's needed.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a routerLink="/register" class="btn-primary bg-white text-primary-700 hover:bg-primary-50 text-base px-8 py-3">
            Apply for a loan
          </a>
          <a routerLink="/login" class="btn-secondary bg-transparent border-white/30 text-white hover:bg-white/10 text-base px-8 py-3">
            Sign in
          </a>
        </div>

        <!-- Stats bar -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
          @for (s of stats; track s.label) {
            <div class="bg-white/10 rounded-xl p-4">
              <p class="text-2xl font-bold text-white">{{ s.value }}</p>
              <p class="text-xs text-primary-200 mt-1">{{ s.label }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ── FEATURES ─────────────────────────────────────── -->
    <section id="features" class="py-20 bg-white">
      <div class="max-w-6xl mx-auto px-4">
        <div class="text-center mb-14">
          <h2 class="text-3xl font-bold text-slate-900 mb-3">Everything in one platform</h2>
          <p class="text-slate-500 max-w-xl mx-auto">
            From application to final repayment — TrustStep handles the full loan lifecycle
            with built-in controls and real-time visibility.
          </p>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (f of features; track f.title) {
            <div class="p-6 rounded-2xl border border-slate-200 hover:border-primary-300 hover:shadow-card-hover transition-all group">
              <div class="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-2xl mb-4 group-hover:bg-primary-100 transition-colors">
                {{ f.icon }}
              </div>
              <h3 class="font-semibold text-slate-900 mb-2">{{ f.title }}</h3>
              <p class="text-sm text-slate-500 leading-relaxed">{{ f.desc }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ── HOW IT WORKS ──────────────────────────────────── -->
    <section id="how-it-works" class="py-20 bg-slate-50">
      <div class="max-w-5xl mx-auto px-4">
        <div class="text-center mb-14">
          <h2 class="text-3xl font-bold text-slate-900 mb-3">How TrustStep works</h2>
          <p class="text-slate-500">A structured, milestone-based disbursement flow with full transparency</p>
        </div>

        <div class="relative">
          <!-- Vertical line -->
          <div class="absolute left-6 sm:left-1/2 top-0 bottom-0 w-0.5 bg-primary-100 hidden sm:block transform -translate-x-1/2"></div>

          <div class="space-y-10">
            @for (step of steps; track step.num; let odd = $odd) {
              <div class="flex flex-col sm:flex-row gap-6 items-center"
                   [class]="odd ? 'sm:flex-row-reverse' : ''">
                <div class="flex-1" [class]="odd ? 'sm:text-right' : ''">
                  <span class="text-xs font-semibold text-primary-600 uppercase tracking-wider">Step {{ step.num }}</span>
                  <h3 class="text-xl font-bold text-slate-900 mt-1">{{ step.title }}</h3>
                  <p class="text-slate-500 mt-2 text-sm leading-relaxed">{{ step.desc }}</p>
                </div>
                <div class="w-14 h-14 rounded-full bg-primary-600 text-white text-xl font-bold flex items-center justify-center shrink-0 shadow-lg z-10">
                  {{ step.icon }}
                </div>
                <div class="flex-1 hidden sm:block"></div>
              </div>
            }
          </div>
        </div>
      </div>
    </section>

    <!-- ── ROLES ─────────────────────────────────────────── -->
    <section id="roles" class="py-20 bg-white">
      <div class="max-w-6xl mx-auto px-4">
        <div class="text-center mb-14">
          <h2 class="text-3xl font-bold text-slate-900 mb-3">Three roles, one platform</h2>
          <p class="text-slate-500">Role-based access ensures each user sees only what they need</p>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          @for (role of roles; track role.name) {
            <div class="rounded-2xl border-2 p-6" [class]="role.borderClass">
              <div class="text-4xl mb-4">{{ role.icon }}</div>
              <h3 class="text-lg font-bold text-slate-900 mb-1">{{ role.name }}</h3>
              <p class="text-sm text-slate-500 mb-4">{{ role.desc }}</p>
              <ul class="space-y-2">
                @for (cap of role.capabilities; track cap) {
                  <li class="flex items-start gap-2 text-sm">
                    <span class="text-emerald-500 mt-0.5 shrink-0">✓</span>
                    <span class="text-slate-600">{{ cap }}</span>
                  </li>
                }
              </ul>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ── LOAN MECHANICS ────────────────────────────────── -->
    <section class="py-20 bg-primary-50">
      <div class="max-w-5xl mx-auto px-4">
        <div class="text-center mb-14">
          <h2 class="text-3xl font-bold text-slate-900 mb-3">Loan mechanics at a glance</h2>
        </div>

        <div class="grid sm:grid-cols-2 gap-6">
          @for (m of mechanics; track m.label) {
            <div class="bg-white rounded-xl p-5 flex gap-4 border border-slate-200">
              <div class="text-3xl shrink-0">{{ m.icon }}</div>
              <div>
                <p class="font-semibold text-slate-900 mb-1">{{ m.label }}</p>
                <p class="text-sm text-slate-500 leading-relaxed">{{ m.desc }}</p>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ── SECURITY ──────────────────────────────────────── -->
    <section id="security" class="py-20 bg-white">
      <div class="max-w-6xl mx-auto px-4">
        <div class="text-center mb-14">
          <h2 class="text-3xl font-bold text-slate-900 mb-3">Built for compliance & security</h2>
          <p class="text-slate-500 max-w-xl mx-auto">
            TrustStep handles sensitive financial data with enterprise-grade security controls.
          </p>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          @for (s of security; track s.title) {
            <div class="text-center p-6 rounded-2xl bg-slate-50">
              <div class="text-3xl mb-3">{{ s.icon }}</div>
              <h3 class="font-semibold text-slate-900 mb-2">{{ s.title }}</h3>
              <p class="text-xs text-slate-500">{{ s.desc }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ── CTA ───────────────────────────────────────────── -->
    <section class="py-20 bg-gradient-to-r from-primary-700 to-primary-900">
      <div class="max-w-3xl mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold text-white mb-4">Ready to grow your business?</h2>
        <p class="text-primary-200 mb-8">
          Apply in minutes. Get milestone-based disbursement with full transparency at every step.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a routerLink="/register" class="btn-primary bg-white text-primary-700 hover:bg-primary-50 text-base px-8 py-3">
            Create account
          </a>
          <a routerLink="/login" class="btn-secondary bg-transparent border-white/30 text-white hover:bg-white/10 text-base px-8 py-3">
            Sign in
          </a>
        </div>
      </div>
    </section>

    <!-- ── FOOTER ────────────────────────────────────────── -->
    <footer class="bg-slate-900 text-slate-400 py-10">
      <div class="max-w-6xl mx-auto px-4">
        <div class="grid sm:grid-cols-3 gap-8 mb-8">
          <div>
            <div class="flex items-center gap-2 mb-3">
              <div class="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-xs">TS</span>
              </div>
              <span class="font-bold text-white">TrustStep</span>
            </div>
            <p class="text-sm leading-relaxed">
              Milestone-Based MSME Loan Disbursement System. Built for India's growing MSMEs.
            </p>
          </div>
          <div>
            <h4 class="text-white font-semibold mb-3">Quick links</h4>
            <ul class="space-y-2 text-sm">
              <li><a routerLink="/login" class="hover:text-white transition-colors">Sign in</a></li>
              <li><a routerLink="/register" class="hover:text-white transition-colors">Register as Borrower</a></li>
              <li><a routerLink="/forgot-password" class="hover:text-white transition-colors">Forgot password</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-white font-semibold mb-3">Portals</h4>
            <ul class="space-y-2 text-sm">
              <li><span class="text-primary-400">Borrower</span> — Apply, track, repay</li>
              <li><span class="text-amber-400">Manager</span> — Review, sanction, disburse</li>
              <li><span class="text-emerald-400">Admin</span> — Configure, audit, manage users</li>
            </ul>
          </div>
        </div>
        <div class="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>© 2026 TrustStep. Milestone-Based MSME Loan System. All rights reserved.</p>
          <p>Backend: Spring Boot · Frontend: Angular 17 · Secured with JWT</p>
        </div>
      </div>
    </footer>
  `
})
export class LandingComponent {
  stats = [
    { value: '₹5L+', label: 'Avg loan disbursed' },
    { value: '3+',   label: 'Milestones per loan' },
    { value: '80/20', label: 'Milestone / Emergency split' },
    { value: '11.5%', label: 'Base interest rate' },
  ];

  features = [
    { icon: '🎯', title: 'Milestone-Based Disbursement', desc: 'Funds are released in tranches tied to verified milestones — ensuring capital is used for its intended purpose.' },
    { icon: '⚡', title: 'Emergency Fund', desc: '20% of the loan is reserved as an instant emergency buffer, withdrawable without approval within the balance.' },
    { icon: '🔄', title: 'Forward Draw', desc: 'Pull up to 50% of a future milestone into the current phase when you need to accelerate work.' },
    { icon: '📋', title: 'KYC & Document Management', desc: 'Upload Aadhaar, PAN, business proof, and bank statements — with automated format validation.' },
    { icon: '📊', title: 'Reducing-Balance EMI', desc: 'EMIs computed on a reducing principal — fair, transparent, and automatically scheduled after moratorium.' },
    { icon: '📑', title: 'Immutable Audit Trail', desc: 'Every action, decision, and disbursement is logged in an append-only audit table — visible to admins at any time.' },
    { icon: '🔔', title: 'Real-Time Notifications', desc: 'Instant in-app alerts for milestone approvals, EMI due dates, moratorium end, and emergency fund updates.' },
    { icon: '⚙️', title: 'Configurable System Rules', desc: 'Admins can adjust interest rates, retention %, moratorium length, and forward-draw caps in real time.' },
    { icon: '🔒', title: 'Role-Based Access Control', desc: 'Three distinct portals — Borrower, Bank Manager, Admin — each with tightly scoped permissions.' },
  ];

  steps = [
    { num: 1, icon: '✏️', title: 'Apply for a loan', desc: 'Borrower submits a loan application with amount, purpose, and tenure. System previews the 80/20 split.' },
    { num: 2, icon: '📋', title: 'KYC & document upload', desc: 'Upload Aadhaar, PAN, business proof, and bank statement. All validation happens before review.' },
    { num: 3, icon: '🎯', title: 'Set up milestones', desc: 'Define 3+ milestone phases with amounts totalling 80% of the loan. Last milestone has 10% retention.' },
    { num: 4, icon: '✅', title: 'Manager review & sanction', desc: 'Bank Manager verifies KYC, reviews the plan, and sanctions the loan with the agreed interest rate.' },
    { num: 5, icon: '💸', title: 'Milestone-by-milestone disbursement', desc: 'Submit photo/invoice proof. Manager approves and funds are released. Next phase begins.' },
    { num: 6, icon: '💳', title: 'Repayment', desc: 'After moratorium, EMIs are auto-scheduled on a reducing-balance basis. Pay online with penalty tracking.' },
  ];

  roles = [
    {
      name: 'Borrower',
      icon: '🏭',
      desc: 'MSME owner applying for and managing a loan',
      borderClass: 'border-primary-200 bg-primary-50',
      capabilities: [
        'Apply for a loan online',
        'Upload KYC documents',
        'Set up milestone plan',
        'Submit milestone proofs',
        'Access emergency fund instantly',
        'Request milestone top-up',
        'Request forward draw',
        'View & pay EMI schedule',
      ]
    },
    {
      name: 'Bank Manager',
      icon: '🏦',
      desc: 'Assigned manager who reviews and disburses',
      borderClass: 'border-amber-200 bg-amber-50',
      capabilities: [
        'Review loan applications',
        'Verify KYC documents',
        'Sanction or reject loans',
        'Review milestone proofs',
        'Approve / partially approve tranches',
        'Review emergency top-up requests',
        'Monitor portfolio dashboard',
        'Search & filter assigned loans',
      ]
    },
    {
      name: 'Admin',
      icon: '⚙️',
      desc: 'System administrator with full access',
      borderClass: 'border-emerald-200 bg-emerald-50',
      capabilities: [
        'Full system dashboard',
        'Manage all users (soft delete)',
        'Configure interest rates & rules',
        'Set retention % & moratorium length',
        'View immutable audit log',
        'Filter audit by user / table / action',
        'Reset user passwords',
        'Monitor system health',
      ]
    }
  ];

  mechanics = [
    { icon: '💰', label: '80 / 20 Fund Split', desc: 'On sanction, 80% goes to the milestone fund (released in tranches) and 20% to the emergency buffer.' },
    { icon: '🔒', label: '10% Retention on Last Milestone', desc: 'The final tranche holds back 10% until the loan is fully completed — protecting against abandonment.' },
    { icon: '📅', label: 'Moratorium Period', desc: 'A configurable grace period (default 3 months) with simple interest accrual before EMI repayment begins.' },
    { icon: '🔁', label: 'Forward Draw (once per milestone)', desc: 'Borrowers can pull up to 50% of a future milestone into the current phase, once, with manager approval.' },
    { icon: '⚡', label: 'Instant Emergency Withdrawal', desc: 'Within the emergency balance, withdrawals are instant — no manager approval needed.' },
    { icon: '📈', label: 'Reducing-Balance Interest', desc: 'EMIs computed on outstanding principal — so as you repay, interest decreases automatically.' },
  ];

  security = [
    { icon: '🔐', title: 'JWT Authentication', desc: 'Stateless JWT tokens with refresh — sessions expire and are invalidated on logout.' },
    { icon: '🛡️', title: 'PAN Encrypted', desc: 'PAN numbers are stored encrypted; unmasking is logged in the audit trail.' },
    { icon: '#️⃣', title: 'Aadhaar Hashed', desc: 'Only the hash + last 4 digits of Aadhaar are stored — never the full number.' },
    { icon: '📑', title: 'Immutable Audit Log', desc: 'Database triggers block UPDATE/DELETE on audit records — append-only by design.' },
  ];
}
