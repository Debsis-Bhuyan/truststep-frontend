import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/admin.model';
import { EmiScheduleResponse, EmiPayRequest } from '../models/emi.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmiService {
  private readonly base = `${environment.apiUrl}/api/loans`;

  constructor(private http: HttpClient) {}

  getScheduleByLoan(loanId: number): Observable<ApiResponse<EmiScheduleResponse[]>> {
    return this.http.get<ApiResponse<EmiScheduleResponse[]>>(`${this.base}/${loanId}/emi`);
  }

  payEmi(loanId: number, emiId: number, req: EmiPayRequest): Observable<ApiResponse<EmiScheduleResponse>> {
    return this.http.patch<ApiResponse<EmiScheduleResponse>>(
      `${this.base}/${loanId}/emi/${emiId}/pay`, req);
  }
}
