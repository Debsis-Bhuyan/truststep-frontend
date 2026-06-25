export type MilestoneStatus =
  | 'PENDING' | 'IN_PROGRESS' | 'PROOF_SUBMITTED' | 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED' | 'COMPLETED';

export interface MilestoneRequest {
  description: string;
  amount: number;
  isLast: boolean;
}

export interface BulkMilestoneRequest {
  milestones: MilestoneRequest[];
}

export interface MilestoneResponse {
  id: number;
  loanId: number;
  sequenceNumber: number;
  description: string;
  amount: number;
  retentionAmount: number;
  status: MilestoneStatus;
  isLast: boolean;
}

export interface MilestoneProofRequest {
  noteToManager: string;
}

export interface MilestoneProofResponse {
  id: number;
  milestoneId: number;
  photoUrl: string;
  invoiceUrl: string;
  note: string;
  submittedAt: string;
}

export interface MilestoneApprovalRequest {
  decision: 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED';
  amountToRelease: number;
  remarks: string;
}

export interface MilestoneApprovalResponse {
  id: number;
  milestoneId: number;
  managerId: number;
  decision: string;
  amountReleased: number;
  remarks: string;
  approvedAt: string;
}

export interface MilestoneReallocationRequest {
  fromMilestoneId: number;
  toMilestoneId: number;
  amount: number;
  purpose: 'FORWARD_DRAW' | 'EMERGENCY_BORROW';
  reason: string;
}

export interface MilestoneReallocationResponse {
  id: number;
  fromMilestoneId: number;
  toMilestoneId: number;
  amount: number;
  purpose: string;
  reason: string;
  status: string;
  createdAt: string;
}
