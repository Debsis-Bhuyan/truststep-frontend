export type EmiStatus = 'UPCOMING' | 'DUE' | 'PAID' | 'OVERDUE';

export interface EmiScheduleResponse {
  id: number;
  loanId: number;
  emiNumber: number;
  dueDate: string;
  emiAmount: number;
  principal: number;
  interest: number;
  penalty: number;
  status: EmiStatus;
  paidAt?: string;
}
