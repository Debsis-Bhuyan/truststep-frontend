export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  pan: string;
  aadhaarLast4: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  role: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type GenderType = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export interface UserProfileResponse {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  profilePhoto: string;
  dateOfBirth: string;
  gender: GenderType;
  aadhaarLast4: string;
  kycComplete: boolean;
  active: boolean;
  verified: boolean;
  lastLogin: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  profilePhoto?: string;
  dateOfBirth?: string;
  gender?: GenderType;
}
