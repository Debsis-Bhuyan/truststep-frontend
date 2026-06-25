import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/admin.model';
import {
  BulkMilestoneRequest, MilestoneResponse,
  MilestoneApprovalRequest, MilestoneApprovalResponse,
  MilestoneProofResponse, MilestoneReallocationRequest, MilestoneReallocationResponse
} from '../models/milestone.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MilestoneService {
  private readonly base = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  saveMilestones(loanId: number, req: BulkMilestoneRequest): Observable<ApiResponse<MilestoneResponse[]>> {
    return this.http.post<ApiResponse<MilestoneResponse[]>>(`${this.base}/milestones/bulk/${loanId}`, req);
  }

  getMilestonesByLoan(loanId: number): Observable<ApiResponse<MilestoneResponse[]>> {
    return this.http.get<ApiResponse<MilestoneResponse[]>>(`${this.base}/milestones/loan/${loanId}`);
  }

  getMilestoneById(id: number): Observable<ApiResponse<MilestoneResponse>> {
    return this.http.get<ApiResponse<MilestoneResponse>>(`${this.base}/milestones/${id}`);
  }

  submitProof(milestoneId: number, formData: FormData): Observable<ApiResponse<MilestoneProofResponse>> {
    return this.http.post<ApiResponse<MilestoneProofResponse>>(`${this.base}/milestone-proofs/${milestoneId}`, formData);
  }

  getProofByMilestone(milestoneId: number): Observable<ApiResponse<MilestoneProofResponse>> {
    return this.http.get<ApiResponse<MilestoneProofResponse>>(`${this.base}/milestone-proofs/milestone/${milestoneId}`);
  }

  reviewMilestone(milestoneId: number, managerId: number, req: MilestoneApprovalRequest): Observable<ApiResponse<MilestoneApprovalResponse>> {
    return this.http.post<ApiResponse<MilestoneApprovalResponse>>(
      `${this.base}/milestone-approvals/${milestoneId}?managerId=${managerId}`, req);
  }

  requestReallocation(loanId: number, req: MilestoneReallocationRequest): Observable<ApiResponse<MilestoneReallocationResponse>> {
    return this.http.post<ApiResponse<MilestoneReallocationResponse>>(`${this.base}/milestone-reallocations/${loanId}`, req);
  }

  approveReallocation(id: number, managerId: number, approve: boolean): Observable<ApiResponse<MilestoneReallocationResponse>> {
    const action = approve ? 'approve' : 'reject';
    return this.http.post<ApiResponse<MilestoneReallocationResponse>>(
      `${this.base}/milestone-reallocations/${id}/${action}?managerId=${managerId}`, {});
  }
}
