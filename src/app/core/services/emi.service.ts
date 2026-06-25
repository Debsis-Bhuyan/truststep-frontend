import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/admin.model';
import { EmiScheduleResponse } from '../models/emi.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmiService {
  private readonly base = `${environment.apiUrl}/api/emi-schedules`;

  constructor(private http: HttpClient) {}

  getScheduleByLoan(loanId: number): Observable<ApiResponse<EmiScheduleResponse[]>> {
    return this.http.get<ApiResponse<EmiScheduleResponse[]>>(`${this.base}/loan/${loanId}`);
  }

  payEmi(emiId: number): Observable<ApiResponse<EmiScheduleResponse>> {
    return this.http.post<ApiResponse<EmiScheduleResponse>>(`${this.base}/${emiId}/pay`, {});
  }
}
