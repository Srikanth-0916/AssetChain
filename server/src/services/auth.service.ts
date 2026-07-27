import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/database';
import { generateToken, JWTPayload } from '../middleware/auth';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  UnprocessableError,
} from '../utils/errors';

/**
 * Authentication service handling registration, login, and password management.
 */
export class AuthService {
  /**
   * Register a new user.
   */
  async register(data: {
    full_name: string;
    email: string;
    password: string;
    role: 'asset_owner' | 'investor';
  }) {
    // Check if email already exists
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', data.email)
      .single();

    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(data.password, salt);

    // Create user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        id: uuidv4(),
        full_name: data.full_name,
        email: data.email,
        password_hash,
        role: data.role,
        kyc_status: 'not_submitted',
        is_suspended: false,
      })
      .select('id, full_name, email, role, kyc_status, created_at')
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    // Generate JWT
    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const token = generateToken(tokenPayload);

    return { user, token };
  }

  /**
   * Authenticate user with email and password.
   */
  async login(email: string, password: string) {
    // Find user by email
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, password_hash, role, kyc_status, wallet_address, is_suspended, created_at')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if suspended
    if (user.is_suspended) {
      throw new UnauthorizedError('Your account has been suspended. Please contact support.');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate JWT
    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      walletAddress: user.wallet_address || undefined,
    };
    const token = generateToken(tokenPayload);

    // Remove password_hash from response
    const { password_hash: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  /**
   * Initiate password reset by generating a reset token.
   * In production, this would send an email. For now, stores the token.
   */
  async forgotPassword(email: string) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If an account with that email exists, a reset link has been sent.' };
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await supabaseAdmin
      .from('users')
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetExpiry,
      })
      .eq('id', user.id);

    // TODO: Send email with reset link containing the token
    // For development, log the token
    console.log(`[DEV] Password reset token for ${email}: ${resetToken}`);

    return { message: 'If an account with that email exists, a reset link has been sent.' };
  }

  /**
   * Reset password using a valid reset token.
   */
  async resetPassword(token: string, newPassword: string) {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, reset_token_expiry')
      .eq('reset_token', token)
      .single();

    if (error || !user) {
      throw new UnprocessableError('Invalid or expired reset token');
    }

    // Check expiry
    if (new Date(user.reset_token_expiry) < new Date()) {
      throw new UnprocessableError('Reset token has expired');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    await supabaseAdmin
      .from('users')
      .update({
        password_hash,
        reset_token: null,
        reset_token_expiry: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    return { message: 'Password reset successful' };
  }

  /**
   * Get user profile by ID.
   */
  async getUserById(userId: string) {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, wallet_address, role, kyc_status, is_suspended, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new NotFoundError('User');
    }

    return user;
  }
}

export const authService = new AuthService();
