export type EmergencyStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISBURSED';
export type AccessType = 'DIRECT' | 'EXTRA_REQUEST';
export type EmergencyTypeEnum = 'MEDICAL' | 'EQUIPMENT' | 'WORKING_CAPITAL' | 'OTHER';
export type PriorityEnum = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface EmergencyTransactionRequest {
  loanId: number;
  requestedById: number;
  amountRequested: number;
  accessType: AccessType;
  reason: string;
  proofUrl?: string;
  hasProof?: boolean;
  emergencyType?: EmergencyTypeEnum;
  priority?: PriorityEnum;
}

export interface EmergencyTransactionResponse {
  emergencyId: number;
  loanId: number;
  requestedById: number;
  requestedByName: string;
  reviewedById: number;
  reviewedByName: string;
  amountRequested: number;
  amountDisbursed: number;
  accessType: AccessType;
  reason: string;
  proofUrl: string;
  hasProof: boolean;
  emergencyType: EmergencyTypeEnum;
  priority: PriorityEnum;
  status: EmergencyStatus;
  managerRemarks: string;
  requestedAt: string;
  decidedAt: string;
  disbursedAt: string;
}
