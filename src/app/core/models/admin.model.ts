export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
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
  moratoriumRate: number;
  retentionPercent: number;
  moratoriumMonths: number;
  forwardDrawCapPercent: number;
  emergencyFundPercent: number;
  milestoneFundPercent: number;
  latePenaltyPercent: number;
}

export interface SystemConfigRequest {
  baseInterestRate: number;
  moratoriumRate: number;
  retentionPercent: number;
  moratoriumMonths: number;
  forwardDrawCapPercent: number;
}

export interface AuditLogResponse {
  id: number;
  userId: number;
  userName: string;
  tableName: string;
  action: string;
  ipAddress: string;
  createdAt: string;
}

export interface AdminDashboardResponse {
  totalUsers: number;
  activeLoans: number;
  totalManagers: number;
  inactiveUsers: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
