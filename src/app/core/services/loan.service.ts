import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PageResponse } from '../models/admin.model';
import { LoanApplyRequest, LoanResponse, LoanStatus, SanctionLoanRequest } from '../models/loan.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LoanService {
  private readonly base = `${environment.apiUrl}/api/loans`;

  constructor(private http: HttpClient) {}

  applyLoan(borrowerId: number, req: LoanApplyRequest): Observable<ApiResponse<LoanResponse>> {
    return this.http.post<ApiResponse<LoanResponse>>(`${this.base}/apply/${borrowerId}`, req);
  }

  getLoanById(id: number): Observable<ApiResponse<LoanResponse>> {
    return this.http.get<ApiResponse<LoanResponse>>(`${this.base}/${id}`);
  }

  getLoansByBorrower(borrowerId: number): Observable<ApiResponse<LoanResponse[]>> {
    return this.http.get<ApiResponse<LoanResponse[]>>(`${this.base}/borrower/${borrowerId}`);
  }

  getLoansByManager(managerId: number): Observable<ApiResponse<LoanResponse[]>> {
    return this.http.get<ApiResponse<LoanResponse[]>>(`${this.base}/manager/${managerId}`);
  }

  searchLoans(managerId: number, keyword?: string, status?: LoanStatus): Observable<ApiResponse<LoanResponse[]>> {
    let params = new HttpParams().set('managerId', managerId.toString());
    if (keyword) params = params.set('keyword', keyword);
    if (status)  params = params.set('status',  status);
    return this.http.get<ApiResponse<LoanResponse[]>>(`${this.base}/search`, { params });
  }

  sanctionLoan(id: number, managerId: number, req: SanctionLoanRequest): Observable<ApiResponse<LoanResponse>> {
    const params = new HttpParams().set('managerId', managerId.toString());
    return this.http.post<ApiResponse<LoanResponse>>(`${this.base}/${id}/sanction`, req, { params });
  }

  rejectLoan(id: number, reason: string): Observable<ApiResponse<LoanResponse>> {
    const params = new HttpParams().set('reason', reason);
    return this.http.post<ApiResponse<LoanResponse>>(`${this.base}/${id}/reject`, {}, { params });
  }

  getAllLoans(page = 0, size = 10): Observable<ApiResponse<PageResponse<LoanResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<LoanResponse>>>(this.base, { params });
  }

  getLoansByStatus(status: LoanStatus, page = 0, size = 10): Observable<ApiResponse<PageResponse<LoanResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<LoanResponse>>>(`${this.base}/status/${status}`, { params });
  }
}
