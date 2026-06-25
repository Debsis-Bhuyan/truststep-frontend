export type LoanStatus =
  | 'APPLIED' | 'UNDER_REVIEW' | 'SANCTIONED' | 'ACTIVE'
  | 'MORATORIUM' | 'REPAYMENT' | 'CLOSED' | 'REJECTED';

export interface LoanApplyRequest {
  loanAmount: number;
  loanType: string;
  purpose: string;
  tenureMonths: number;
}

export interface LoanResponse {
  id: number;
  loanNumber: string;
  borrowerId: number;
  borrowerName: string;
  managerId: number;
  managerName: string;
  loanAmount: number;
  loanType: string;
  purpose: string;
  tenureMonths: number;
  interestRate: number;
  milestoneFund: number;
  emergencyFund: number;
  disbursedAmount: number;
  status: LoanStatus;
  createdAt: string;
  sanctionedAt: string;
}

export interface SanctionLoanRequest {
  interestRate: number;
  tenureMonths: number;
  remarks: string;
}

export interface BorrowerDashboardResponse {
  loanId: number;
  loanNumber: string;
  sanctionedAmount: number;
  disbursedAmount: number;
  emergencyBalance: number;
  loanStatus: LoanStatus;
  milestones: MilestoneSummary[];
  nextStep: string;
}

export interface MilestoneSummary {
  id: number;
  description: string;
  status: string;
  amount: number;
}

export interface ManagerDashboardResponse {
  assignedLoans: number;
  pendingProofs: number;
  emergencyRequests: number;
  totalDisbursed: number;
  pendingActions: PendingAction[];
}

export interface PendingAction {
  loanId: number;
  loanNumber: string;
  borrowerName: string;
  item: string;
  type: string;
}
