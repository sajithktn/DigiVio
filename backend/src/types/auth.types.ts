export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  company_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface AuthSessionResponse {
  user: UserProfile;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RegisterDTO {
  email: string;
  password: string;
  confirm_password?: string;
  full_name: string;
  company_name?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface ResendVerificationDTO {
  email: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  password: string;
  confirm_password?: string;
}

export interface UpdateProfileDTO {
  full_name?: string;
  company_name?: string;
  phone?: string;
  avatar_url?: string;
}
