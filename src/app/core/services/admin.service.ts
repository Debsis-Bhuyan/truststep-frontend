import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiResponse, PageResponse,
  AdminDashboardResponse, AuditLogResponse,
  SystemConfigResponse, SystemConfigRequest, UserManagementResponse
} from '../models/admin.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly base = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  /* ── Admin dashboard ─────────────────────────── */

  getDashboard(): Observable<ApiResponse<AdminDashboardResponse>> {
    return this.http.get<ApiResponse<AdminDashboardResponse>>(`${this.base}/admin/dashboard`);
  }

  /* ── User management: /api/admin/users ───────── */

  getUsers(page = 0, size = 20, role?: string, isActive?: boolean): Observable<ApiResponse<PageResponse<UserManagementResponse>>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (role) params = params.set('role', role);
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());
    return this.http.get<ApiResponse<PageResponse<UserManagementResponse>>>(`${this.base}/admin/users`, { params });
  }

  deactivateUser(userId: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/admin/users/${userId}/deactivate`, {});
  }

  activateUser(userId: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/admin/users/${userId}/activate`, {});
  }

  resetUserPassword(userId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.base}/admin/users/${userId}/reset-password`, {});
  }

  /* ── System config: /api/admin/config ────────── */

  getSystemConfig(): Observable<ApiResponse<SystemConfigResponse>> {
    return this.http.get<ApiResponse<SystemConfigResponse>>(`${this.base}/admin/config`);
  }

  saveSystemConfig(req: SystemConfigRequest): Observable<ApiResponse<SystemConfigResponse>> {
    return this.http.put<ApiResponse<SystemConfigResponse>>(`${this.base}/admin/config`, req);
  }

  /* ── Audit log: /api/audit ───────────────────── */

  getAuditLogs(page = 0, size = 20): Observable<ApiResponse<PageResponse<AuditLogResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<AuditLogResponse>>>(`${this.base}/audit`, { params });
  }

  getAuditByUser(userId: number): Observable<ApiResponse<AuditLogResponse[]>> {
    return this.http.get<ApiResponse<AuditLogResponse[]>>(`${this.base}/audit/user/${userId}`);
  }
}
