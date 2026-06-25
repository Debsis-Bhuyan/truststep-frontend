export type EmergencyStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface EmergencyTransactionRequest {
  amount: number;
  reason?: string;
  type: 'AUTO' | 'MILESTONE_BORROW';
  borrowFromMilestoneId?: number;
}

export interface EmergencyTransactionResponse {
  id: number;
  loanId: number;
  amount: number;
  type: string;
  reason: string;
  status: EmergencyStatus;
  borrowedFromMilestoneId: number;
  createdAt: string;
}
