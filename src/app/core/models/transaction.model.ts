export type TxnType = 'MILESTONE_DISBURSE' | 'EMERGENCY_AUTO' | 'EMERGENCY_BORROW' | 'FORWARD_DRAW' | 'EMI_PAYMENT' | 'PENALTY';

export interface TransactionResponse {
  id: number;
  loanId: number;
  reference: string;
  type: TxnType;
  amount: number;
  createdAt: string;
}
