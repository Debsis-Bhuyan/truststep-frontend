export type EmiStatus = 'UPCOMING' | 'DUE' | 'PAID' | 'OVERDUE';

export interface EmiScheduleResponse {
  emiId: number;
  loanId: number;
  emiNumber: number;
  dueDate: string;
  emiAmount: number;
  principalPart: number;
  interestPart: number;
  openingBalance: number;
  closingBalance: number;
  paidAmount: number;
  paidOn: string;
  paymentMethod: string;
  daysOverdue: number;
  penaltyAmount: number;
  penaltyRate: number;
  status: EmiStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EmiPayRequest {
  paidAmount: number;
  paidOn?: string;
  paymentMethod?: string;
}
