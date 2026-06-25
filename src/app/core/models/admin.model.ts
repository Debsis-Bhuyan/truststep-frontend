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
  isActive: boolean;
  createdAt: string;
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
