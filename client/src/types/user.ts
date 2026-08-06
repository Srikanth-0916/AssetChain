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
  wallet_type?: string | null;
  wallet_last_login?: string | null;
  wallet_connected?: boolean;
  chain_id?: number;
  wallet_verified?: boolean;
  last_signature_time?: string | null;
  network_name?: string | null;
  connection_status?: string | null;
  role: UserRole;
  kyc_status: KYCStatus;
  is_suspended: boolean;
  created_at: string;
  updated_at?: string;
}


export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
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
