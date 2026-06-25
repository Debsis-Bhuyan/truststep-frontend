export type LoanStatus =
  | 'APPLIED' | 'UNDER_REVIEW' | 'SANCTIONED' | 'ACTIVE'
  | 'MORATORIUM' | 'REPAYMENT' | 'CLOSED' | 'REJECTED';

export type InterestType = 'SIMPLE' | 'COMPOUND' | 'REDUCING';

export interface LoanApplyRequest {
  loanAmount: number;
  loanType: string;
  purpose: string;
  tenureMonths: number;
}

export interface SanctionLoanRequest {
  interestRate: number;
  tenureMonths: number;
  remarks: string;
}

export interface LoanResponse {
  loanId: number;
  loanNumber: string;
  borrowerId: number;
  borrowerName: string;
  managerId: number;
  managerName: string;
  totalApprovedAmount: number;
  milestoneFund: number;
  emergencyFund: number;
  emergencyUsed: number;
  emergencyBalance: number;
  interestRate: number;
  moratoriumInterestRate: number;
  postMoratoriumRate: number;
  interestType: InterestType;
  totalInterestAccrued: number;
  moratoriumMonths: number;
  retentionPercentage: number;
  retentionAmount: number;
  retentionReleased: boolean;
  retentionReleasedOn: string;
  loanType: string;
  purpose: string;
  tenureMonths: number;
  sanctionDate: string;
  startDate: string;
  emiStartDate: string;
  expectedEndDate: string;
  actualEndDate: string;
  totalDisbursed: number;
  totalRepaid: number;
  outstandingBalance: number;
  status: LoanStatus;
  createdAt: string;
  updatedAt: string;
}

/* ── Dashboard shapes ─────────────────────────────────── */

export interface MilestoneSummary {
  milestoneId: number;
  phaseNumber: number;
  description: string;
  status: string;
  allocatedAmount: number;
}

export interface BorrowerDashboardResponse {
  loanId: number;
  loanNumber: string;
  sanctionedAmount: number;
  disbursedAmount: number;
  emergencyLeft: number;
  moratoriumStatus: string;
  loanStatus: LoanStatus;
  milestones: MilestoneSummary[];
  nextStep: string;
}

export interface PendingAction {
  loanId: number;
  loanNumber: string;
  borrowerName: string;
  item: string;
  type: string;
  loanStatus: LoanStatus;
}

export interface ManagerDashboardResponse {
  assignedLoans: number;
  pendingProofs: number;
  emergencyRequests: number;
  totalDisbursed: number;
  pendingActions: PendingAction[];
}
