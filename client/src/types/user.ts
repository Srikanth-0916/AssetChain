/**
 * User types matching the database schema.
 */

export type UserRole = 'admin' | 'asset_owner' | 'investor';
export type KYCStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  full_name: string;
  email: string;
  wallet_address: string | null;
  role: UserRole;
  kyc_status: KYCStatus;
  is_suspended: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  role: 'asset_owner' | 'investor';
}

export interface LoginData {
  email: string;
  password: string;
}
