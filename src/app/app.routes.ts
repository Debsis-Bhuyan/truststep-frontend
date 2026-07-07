import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [

  /* ── Public landing page ─────────────────────────────── */
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },

  /* ── Auth screens ────────────────────────────────────── */
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login',           loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register',        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
      { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
    ]
  },

  /* ── Authenticated shell ─────────────────────────────── */
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [

      /* Shared — all roles */
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },

      /* ── Borrower ───────────────────────────────────── */
      {
        path: 'borrower',
        canActivate: [roleGuard], data: { roles: ['BORROWER', 'ADMIN'] },
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard',      loadComponent: () => import('./features/borrower/dashboard/borrower-dashboard.component').then(m => m.BorrowerDashboardComponent) },
          { path: 'apply',          loadComponent: () => import('./features/borrower/loan-apply/loan-apply.component').then(m => m.LoanApplyComponent) },
          { path: 'loan',           loadComponent: () => import('./features/borrower/loan-detail/loan-detail.component').then(m => m.LoanDetailComponent) },
          { path: 'documents',      loadComponent: () => import('./features/borrower/upload-documents/upload-documents.component').then(m => m.UploadDocumentsComponent) },
          { path: 'milestones',     loadComponent: () => import('./features/borrower/milestone-setup/milestone-setup.component').then(m => m.MilestoneSetupComponent) },
          { path: 'submit-proof',   loadComponent: () => import('./features/borrower/submit-proof/submit-proof.component').then(m => m.SubmitProofComponent) },
          { path: 'emergency',      loadComponent: () => import('./features/borrower/emergency-fund/emergency-fund.component').then(m => m.EmergencyFundComponent) },
          { path: 'milestone-topup',loadComponent: () => import('./features/borrower/milestone-topup/milestone-topup.component').then(m => m.MilestoneTopupComponent) },
          { path: 'forward-draw',   loadComponent: () => import('./features/borrower/forward-draw/forward-draw.component').then(m => m.ForwardDrawComponent) },
          { path: 'repayment',      loadComponent: () => import('./features/borrower/repayment/repayment.component').then(m => m.RepaymentComponent) },
        ]
      },

      /* ── Manager ────────────────────────────────────── */
      {
        path: 'manager',
        canActivate: [roleGuard], data: { roles: ['MANAGER', 'ADMIN'] },
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard',                loadComponent: () => import('./features/manager/dashboard/manager-dashboard.component').then(m => m.ManagerDashboardComponent) },
          { path: 'loans',                    loadComponent: () => import('./features/manager/loan-list/loan-list.component').then(m => m.LoanListComponent) },
          { path: 'loans/:id/review',         loadComponent: () => import('./features/manager/review-sanction/review-sanction.component').then(m => m.ReviewSanctionComponent) },
          { path: 'approvals',                loadComponent: () => import('./features/manager/review-proof/review-proof.component').then(m => m.ReviewProofComponent) },
          { path: 'review-proof/:loanId',     loadComponent: () => import('./features/manager/review-proof/review-proof.component').then(m => m.ReviewProofComponent) },
          { path: 'review-emergency',         loadComponent: () => import('./features/manager/review-emergency/review-emergency.component').then(m => m.ReviewEmergencyComponent) },
          { path: 'review-emergency/:loanId', loadComponent: () => import('./features/manager/review-emergency/review-emergency.component').then(m => m.ReviewEmergencyComponent) },
        ]
      },

      /* ── Admin ──────────────────────────────────────── */
      {
        path: 'admin',
        canActivate: [roleGuard], data: { roles: ['ADMIN'] },
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
          { path: 'loans',     loadComponent: () => import('./features/admin/all-loans/all-loans.component').then(m => m.AllLoansComponent) },
          { path: 'users',     loadComponent: () => import('./features/admin/user-management/user-management.component').then(m => m.UserManagementComponent) },
          { path: 'users/:id', loadComponent: () => import('./features/admin/user-profile/admin-user-profile.component').then(m => m.AdminUserProfileComponent) },
          { path: 'config',    loadComponent: () => import('./features/admin/system-config/system-config.component').then(m => m.SystemConfigComponent) },
          { path: 'audit',     loadComponent: () => import('./features/admin/audit-log/audit-log.component').then(m => m.AuditLogComponent) },
        ]
      },
    ]
  },

  /* ── Fallback ────────────────────────────────────────── */
  { path: '**', redirectTo: '' }
];
