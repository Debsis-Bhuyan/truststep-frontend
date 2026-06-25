import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import {
  LoginRequest, RegisterRequest, AuthResponse,
  ApiResponse, CurrentUser, ForgotPasswordRequest,
  ResetPasswordRequest, ChangePasswordRequest
} from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = `${environment.apiUrl}/api/auth`;

  currentUser = signal<CurrentUser | null>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  login(req: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.base}/login`, req).pipe(
      tap(res => {
        if (res.data) {
          localStorage.setItem('accessToken', res.data.accessToken);
          localStorage.setItem('refreshToken', res.data.refreshToken);
          localStorage.setItem('role', res.data.role);
          this.fetchCurrentUser().subscribe();
        }
      })
    );
  }

  register(req: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.base}/register`, req).pipe(
      tap(res => {
        if (res.data) {
          localStorage.setItem('accessToken', res.data.accessToken);
          localStorage.setItem('refreshToken', res.data.refreshToken);
          localStorage.setItem('role', res.data.role);
        }
      })
    );
  }

  fetchCurrentUser(): Observable<ApiResponse<CurrentUser>> {
    return this.http.post<ApiResponse<CurrentUser>>(`${this.base}/me`, {}).pipe(
      tap(res => {
        if (res.data) {
          localStorage.setItem('user', JSON.stringify(res.data));
          this.currentUser.set(res.data);
        }
      })
    );
  }

  forgotPassword(req: ForgotPasswordRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.base}/forgot-password`, req);
  }

  resetPassword(req: ResetPasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/reset-password`, req);
  }

  changePassword(req: ChangePasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/change-password`, req);
  }

  logout(): void {
    this.http.post(`${this.base}/logout`, {}).subscribe();
    localStorage.clear();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private loadUser(): CurrentUser | null {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  }

  navigateToDashboard(): void {
    const role = this.getRole();
    if (role?.includes('BORROWER')) this.router.navigate(['/borrower/dashboard']);
    else if (role?.includes('MANAGER')) this.router.navigate(['/manager/dashboard']);
    else if (role?.includes('ADMIN')) this.router.navigate(['/admin/dashboard']);
    else this.router.navigate(['/login']);
  }
}
