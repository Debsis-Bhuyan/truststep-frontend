import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/admin.model';
import { BorrowerDashboardResponse, ManagerDashboardResponse } from '../models/loan.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly base = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  getBorrowerDashboard(borrowerId: number): Observable<ApiResponse<BorrowerDashboardResponse>> {
    return this.http.get<ApiResponse<BorrowerDashboardResponse>>(`${this.base}/borrower/${borrowerId}/dashboard`);
  }

  getManagerDashboard(managerId: number): Observable<ApiResponse<ManagerDashboardResponse>> {
    return this.http.get<ApiResponse<ManagerDashboardResponse>>(`${this.base}/manager/${managerId}/dashboard`);
  }
}
