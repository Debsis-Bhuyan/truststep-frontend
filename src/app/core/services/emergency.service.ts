import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/admin.model';
import { EmergencyTransactionRequest, EmergencyTransactionResponse } from '../models/emergency.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmergencyService {
  private readonly base = `${environment.apiUrl}/api/emergency-transactions`;

  constructor(private http: HttpClient) {}

  withdraw(loanId: number, req: EmergencyTransactionRequest): Observable<ApiResponse<EmergencyTransactionResponse>> {
    return this.http.post<ApiResponse<EmergencyTransactionResponse>>(`${this.base}/${loanId}`, req);
  }

  getByLoan(loanId: number): Observable<ApiResponse<EmergencyTransactionResponse[]>> {
    return this.http.get<ApiResponse<EmergencyTransactionResponse[]>>(`${this.base}/loan/${loanId}`);
  }

  getPending(): Observable<ApiResponse<EmergencyTransactionResponse[]>> {
    return this.http.get<ApiResponse<EmergencyTransactionResponse[]>>(`${this.base}/pending`);
  }

  approve(id: number, managerId: number, remarks: string): Observable<ApiResponse<EmergencyTransactionResponse>> {
    return this.http.post<ApiResponse<EmergencyTransactionResponse>>(
      `${this.base}/${id}/approve?managerId=${managerId}`, { remarks });
  }

  reject(id: number, managerId: number, remarks: string): Observable<ApiResponse<EmergencyTransactionResponse>> {
    return this.http.post<ApiResponse<EmergencyTransactionResponse>>(
      `${this.base}/${id}/reject?managerId=${managerId}`, { remarks });
  }
}
