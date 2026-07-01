export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface UserManagementResponse {
  id: number;
  fullName: string;
  email: string;
  role: string;
  active: boolean;
}

export type GenderType = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export interface AdminUserDto {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  enabled: boolean;
  verified: boolean;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  profilePhoto: string | null;
  dateOfBirth: string | null;
  gender: GenderType | null;
  aadhaarLast4: string | null;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface SystemConfigResponse {
  id: number;
  baseInterestRate: number;
  moratoriumInterestRate: number;
  retentionPercent: number;
  moratoriumMonths: number;
  forwardDrawCapPercent: number;
  emergencyFundPercent: number;
  milestoneFundPercent: number;
  latePenaltyPercent: number;
}

export interface SystemConfigRequest {
  baseInterestRate: number;
  moratoriumInterestRate: number;
  retentionPercent: number;
  moratoriumMonths: number;
  forwardDrawCapPercent: number;
}

export interface AuditLogResponse {
  logId: number;
  tableName: string;
  recordId: number;
  action: string;
  oldValues: string;
  newValues: string;
  changedById: number;
  changedByName: string;
  ipAddress: string;
  userAgent: string;
  changedAt: string;
}

export interface AdminDashboardResponse {
  totalUsers: number;
  activeLoans: number;
  totalManagers: number;
  inactiveUsers: number;
}
