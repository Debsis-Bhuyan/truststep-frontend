import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/admin.model';
import { LoanDocumentResponse } from '../models/document.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly base = `${environment.apiUrl}/api/loan-documents`;

  constructor(private http: HttpClient) {}

  upload(loanId: number, docType: string, file: File): Observable<ApiResponse<LoanDocumentResponse>> {
    const form = new FormData();
    form.append('file', file);
    form.append('docType', docType);
    return this.http.post<ApiResponse<LoanDocumentResponse>>(`${this.base}/${loanId}`, form);
  }

  getByLoan(loanId: number): Observable<ApiResponse<LoanDocumentResponse[]>> {
    return this.http.get<ApiResponse<LoanDocumentResponse[]>>(`${this.base}/loan/${loanId}`);
  }
}
