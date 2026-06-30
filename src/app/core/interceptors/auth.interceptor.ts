import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Module-level so the refresh is single-flight across all concurrent requests, not per-interceptor-call.
let isRefreshing = false;
const refreshedToken$ = new BehaviorSubject<string | null>(null);

const NO_RETRY_URLS = ['/api/auth/refresh', '/api/auth/login', '/api/auth/register', '/api/auth/logout'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = localStorage.getItem('accessToken');

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuthEndpoint = NO_RETRY_URLS.some(url => req.url.includes(url));
      // Only a 401 (authentication problem) is worth a token refresh; 403 means the
      // token is fine but the user lacks permission, so refreshing won't help.
      if (isAuthEndpoint || err.status !== 401) {
        return throwError(() => err);
      }

      if (isRefreshing) {
        return refreshedToken$.pipe(
          filter((t) => t !== null),
          take(1),
          switchMap((newToken) => next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })))
        );
      }

      isRefreshing = true;
      refreshedToken$.next(null);

      return authService.refreshToken().pipe(
        switchMap((res) => {
          const newToken = res.data?.accessToken;
          if (!newToken) {
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => err);
          }
          isRefreshing = false;
          refreshedToken$.next(newToken);
          return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
        }),
        catchError(() => {
          isRefreshing = false;
          authService.logout();
          router.navigate(['/login']);
          return throwError(() => err);
        })
      );
    })
  );
};
