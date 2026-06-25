export type MilestoneStatus =
  | 'PENDING' | 'IN_PROGRESS' | 'PROOF_SUBMITTED'
  | 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED' | 'COMPLETED';

export type ApprovalDecision = 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED';
export type ReallocationPurpose = 'FORWARD_DRAW' | 'EMERGENCY_BORROW';
export type ReallocationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

/* ── Milestone ─────────────────────────────────────────── */

export interface MilestoneRequest {
  description: string;
  allocatedAmount: number;
  isLastMilestone: boolean;
  plannedStartDate?: string;
  plannedEndDate?: string;
}

export interface BulkMilestoneRequest {
  milestones: MilestoneRequest[];
}

export interface MilestoneResponse {
  milestoneId: number;
  loanId: number;
  phaseNumber: number;
  description: string;
  isLastMilestone: boolean;
  originalAmount: number;
  allocatedAmount: number;
  retentionAmount: number;
  releasableAmount: number;
  disbursedAmount: number;
  forwardDrawnAmount: number;
  forwardDrawUsed: boolean;
  plannedStartDate: string;
  plannedEndDate: string;
  actualCompletionDate: string;
  status: MilestoneStatus;
  createdAt: string;
  updatedAt: string;
}

/* ── Proof ─────────────────────────────────────────────── */

export type ProofType = 'PHOTO' | 'INVOICE' | 'RECEIPT' | 'OTHER';

export interface MilestoneProofRequest {
  milestoneId: number;
  loanId: number;
  submittedById: number;
  proofType: ProofType;
  fileName: string;
  fileUrl: string;
  fileSizeKb?: number;
  description?: string;
}

export interface MilestoneProofResponse {
  proofId: number;
  milestoneId: number;
  loanId: number;
  submittedById: number;
  submittedByName: string;
  proofType: ProofType;
  fileName: string;
  fileUrl: string;
  fileSizeKb: number;
  description: string;
  submittedAt: string;
}

/* ── Approval ──────────────────────────────────────────── */

export interface MilestoneApprovalRequest {
  milestoneId: number;
  loanId: number;
  reviewedById: number;
  decision: ApprovalDecision;
  amountToRelease: number;
  remarks?: string;
  rejectionReason?: string;
  resubmissionAllowed?: boolean;
  resubmissionDeadline?: string;
}

export interface MilestoneApprovalResponse {
  approvalId: number;
  milestoneId: number;
  loanId: number;
  reviewedById: number;
  reviewedByName: string;
  decision: ApprovalDecision;
  amountToRelease: number;
  remarks: string;
  rejectionReason: string;
  resubmissionAllowed: boolean;
  resubmissionDeadline: string;
  reviewedAt: string;
}

/* ── Reallocation ──────────────────────────────────────── */

export interface MilestoneReallocationRequest {
  loanId: number;
  requestedById: number;
  purpose: ReallocationPurpose;
  fromMilestoneId: number;
  toMilestoneId?: number;
  amount: number;
  reason: string;
  proofUrl?: string;
}

export interface MilestoneReallocationResponse {
  reallocationId: number;
  loanId: number;
  requestedById: number;
  requestedByName: string;
  approvedById: number;
  approvedByName: string;
  purpose: ReallocationPurpose;
  fromMilestoneId: number;
  toMilestoneId: number;
  amount: number;
  reason: string;
  proofUrl: string;
  status: ReallocationStatus;
  managerRemarks: string;
  requestedAt: string;
  decidedAt: string;
}
