import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowedRoles: string[] = route.data['roles'] ?? [];
  const role = auth.getRole() ?? '';
  const hasRole = allowedRoles.some(r => role.includes(r));
  if (hasRole) return true;
  auth.navigateToDashboard();
  return false;
};
