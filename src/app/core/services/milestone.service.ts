import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/admin.model';
import {
  BulkMilestoneRequest, MilestoneResponse,
  MilestoneApprovalRequest, MilestoneApprovalResponse,
  MilestoneProofRequest, MilestoneProofResponse,
  MilestoneReallocationRequest, MilestoneReallocationResponse,
  ReallocationStatus
} from '../models/milestone.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MilestoneService {
  private readonly base = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  /* ── Milestones: /api/loans/{loanId}/milestones ──────── */

  saveMilestones(loanId: number, req: BulkMilestoneRequest): Observable<ApiResponse<MilestoneResponse[]>> {
    return this.http.post<ApiResponse<MilestoneResponse[]>>(
      `${this.base}/loans/${loanId}/milestones/bulk`, req);
  }

  getMilestonesByLoan(loanId: number): Observable<ApiResponse<MilestoneResponse[]>> {
    return this.http.get<ApiResponse<MilestoneResponse[]>>(
      `${this.base}/loans/${loanId}/milestones`);
  }

  getMilestoneById(loanId: number, milestoneId: number): Observable<ApiResponse<MilestoneResponse>> {
    return this.http.get<ApiResponse<MilestoneResponse>>(
      `${this.base}/loans/${loanId}/milestones/${milestoneId}`);
  }

  /* ── Proofs: /api/milestones/{milestoneId}/proofs ─────── */

  submitProof(milestoneId: number, req: MilestoneProofRequest): Observable<ApiResponse<MilestoneProofResponse>> {
    return this.http.post<ApiResponse<MilestoneProofResponse>>(
      `${this.base}/milestones/${milestoneId}/proofs`, req);
  }

  getProofsByMilestone(milestoneId: number): Observable<ApiResponse<MilestoneProofResponse[]>> {
    return this.http.get<ApiResponse<MilestoneProofResponse[]>>(
      `${this.base}/milestones/${milestoneId}/proofs`);
  }

  getProofsByLoan(loanId: number): Observable<ApiResponse<MilestoneProofResponse[]>> {
    return this.http.get<ApiResponse<MilestoneProofResponse[]>>(
      `${this.base}/milestones/0/proofs/loan/${loanId}`);
  }

  /* ── Approvals: /api/milestones/{milestoneId}/approvals ─ */

  reviewMilestone(milestoneId: number, req: MilestoneApprovalRequest): Observable<ApiResponse<MilestoneApprovalResponse>> {
    return this.http.post<ApiResponse<MilestoneApprovalResponse>>(
      `${this.base}/milestones/${milestoneId}/approvals`, req);
  }

  getApprovalsByMilestone(milestoneId: number): Observable<ApiResponse<MilestoneApprovalResponse[]>> {
    return this.http.get<ApiResponse<MilestoneApprovalResponse[]>>(
      `${this.base}/milestones/${milestoneId}/approvals`);
  }

  getApprovalsByLoan(loanId: number): Observable<ApiResponse<MilestoneApprovalResponse[]>> {
    return this.http.get<ApiResponse<MilestoneApprovalResponse[]>>(
      `${this.base}/milestones/0/approvals/loan/${loanId}`);
  }

  /* ── Reallocations: /api/reallocations ───────────────── */

  requestReallocation(req: MilestoneReallocationRequest): Observable<ApiResponse<MilestoneReallocationResponse>> {
    return this.http.post<ApiResponse<MilestoneReallocationResponse>>(
      `${this.base}/reallocations`, req);
  }

  getPendingReallocations(): Observable<ApiResponse<MilestoneReallocationResponse[]>> {
    return this.http.get<ApiResponse<MilestoneReallocationResponse[]>>(
      `${this.base}/reallocations/pending`);
  }

  getReallocationsByLoan(loanId: number): Observable<ApiResponse<MilestoneReallocationResponse[]>> {
    return this.http.get<ApiResponse<MilestoneReallocationResponse[]>>(
      `${this.base}/reallocations/loan/${loanId}`);
  }

  decideReallocation(id: number, decision: ReallocationStatus, managerRemarks?: string): Observable<ApiResponse<MilestoneReallocationResponse>> {
    const params = new HttpParams().set('decision', decision);
    return this.http.patch<ApiResponse<MilestoneReallocationResponse>>(
      `${this.base}/reallocations/${id}/decide`, { managerRemarks }, { params });
  }
}
