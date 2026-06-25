import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/admin.model';
import { EmergencyTransactionRequest, EmergencyTransactionResponse, EmergencyStatus } from '../models/emergency.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmergencyService {
  private readonly base = `${environment.apiUrl}/api/emergency`;

  constructor(private http: HttpClient) {}

  /** Direct auto-withdrawal within balance — no approval needed */
  directWithdraw(req: EmergencyTransactionRequest): Observable<ApiResponse<EmergencyTransactionResponse>> {
    return this.http.post<ApiResponse<EmergencyTransactionResponse>>(`${this.base}/direct`, req);
  }

  /** Extra request — needs manager approval */
  extraRequest(req: EmergencyTransactionRequest): Observable<ApiResponse<EmergencyTransactionResponse>> {
    return this.http.post<ApiResponse<EmergencyTransactionResponse>>(`${this.base}/request`, req);
  }

  getByLoan(loanId: number): Observable<ApiResponse<EmergencyTransactionResponse[]>> {
    return this.http.get<ApiResponse<EmergencyTransactionResponse[]>>(`${this.base}/loan/${loanId}`);
  }

  getById(id: number): Observable<ApiResponse<EmergencyTransactionResponse>> {
    return this.http.get<ApiResponse<EmergencyTransactionResponse>>(`${this.base}/${id}`);
  }

  /** Manager decision: APPROVED or REJECTED */
  decide(id: number, decision: EmergencyStatus, amountDisbursed?: number, remarks?: string): Observable<ApiResponse<EmergencyTransactionResponse>> {
    const params = new HttpParams().set('decision', decision);
    return this.http.patch<ApiResponse<EmergencyTransactionResponse>>(
      `${this.base}/${id}/decide`, { amountDisbursed, remarks }, { params });
  }
}
