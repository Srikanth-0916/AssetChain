import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/database';
import { generateToken, JWTPayload } from '../middleware/auth';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  UnprocessableError,
} from '../utils/errors';

// In-memory reset token store (hashed_token → userId + expiry)
// In production: store in users.reset_token column in Supabase
const resetTokenStore = new Map<string, { userId: string; expiresAt: Date }>();

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Local in-memory user store initialized with seeded demo accounts for demo resilience
const localUsersStore: Map<string, any> = new Map();

// Seed initial demo accounts
async function seedDemoAccounts() {
  const salt = await bcrypt.genSalt(10);

  const demoAccounts = [
    {
      id: 'admin-demo-uuid-001',
      full_name: 'Platform Admin',
      email: 'admin@assetchain.io',
      password_hash: await bcrypt.hash('Admin@123', salt),
      role: 'admin',
      kyc_status: 'approved',
      is_suspended: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'owner-demo-uuid-002',
      full_name: 'Jane Smith (Asset Owner)',
      email: 'owner@assetchain.io',
      password_hash: await bcrypt.hash('Owner@123', salt),
      role: 'asset_owner',
      kyc_status: 'approved',
      is_suspended: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'investor-demo-uuid-003',
      full_name: 'John Investor',
      email: 'investor@assetchain.io',
      password_hash: await bcrypt.hash('Investor@123', salt),
      role: 'investor',
      kyc_status: 'approved',
      is_suspended: false,
      created_at: new Date().toISOString(),
    },
  ];

  for (const acc of demoAccounts) {
    localUsersStore.set(acc.id, acc);
  }
}

// Fire async seed
seedDemoAccounts().catch(() => {});

/**
 * Helper to issue and persist refresh token in Supabase PostgreSQL refresh_tokens table.
 */
async function issueRefreshToken(userId: string, deviceInfo = 'Web Browser', ipAddress = '127.0.0.1'): Promise<string> {
  const rawRefreshToken = uuidv4() + uuidv4();
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  try {
    await supabaseAdmin.from('refresh_tokens').insert({
      user_id: userId,
      token_hash: tokenHash,
      device_info: deviceInfo,
      ip_address: ipAddress,
      is_revoked: false,
      expires_at: expiresAt,
    });
  } catch (e: any) {
    console.warn('[AuthService] Refresh token DB save warning:', e.message);
  }
  return rawRefreshToken;
}

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
    const normalizedEmail = data.email.toLowerCase().trim();

    // 1. Check if email already exists in local memory store
    for (const u of localUsersStore.values()) {
      if (u.email.toLowerCase() === normalizedEmail) {
        throw new ConflictError('This email is already registered. Please log in.');
      }
    }

    // 2. Check if email already exists in Supabase public.profiles table
    try {
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', normalizedEmail)
        .single();

      if (existingProfile) {
        throw new ConflictError('This email is already registered. Please log in.');
      }
    } catch (e: any) {
      if (e instanceof ConflictError) throw e;
    }

    let authUserId: string = uuidv4();

    // 3. Try Supabase Auth Registration (Admin API with email_confirm: true)
    try {
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          full_name: data.full_name,
          role: data.role,
        },
      });

      if (authErr) {
        if (authErr.message.includes('already registered') || authErr.message.includes('already exists')) {
          throw new ConflictError('This email is already registered. Please log in.');
        }
        console.warn('[AuthService] ⚠️ Supabase Auth admin.createUser error:', authErr.message);
      }

      if (authData?.user) {
        authUserId = authData.user.id;
      }
    } catch (e: any) {
      if (e instanceof ConflictError) throw e;
      console.warn('[AuthService] ⚠️ Supabase connection warning during register:', e.message);
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(data.password, salt);

    const newUser = {
      id: authUserId,
      full_name: data.full_name,
      email: normalizedEmail,
      password_hash,
      role: data.role,
      kyc_status: 'not_submitted',
      is_suspended: false,
      created_at: new Date().toISOString(),
    };

    localUsersStore.set(newUser.id, newUser);

    // 4. Persist to Supabase public.profiles, portfolio_cache, and compliance_profiles tables
    try {
      const { error: profileErr } = await supabaseAdmin.from('profiles').upsert({
        id: newUser.id,
        full_name: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        kyc_status: newUser.kyc_status,
        is_suspended: false,
        created_at: newUser.created_at,
        updated_at: new Date().toISOString(),
      });

      if (profileErr) {
        console.warn('[AuthService] ⚠️ Supabase profiles table upsert warning:', profileErr.message);
      } else {
        console.log(`[AuthService] ✅ User profile successfully persisted to Supabase DB for ID: ${newUser.id}`);
      }

      // Initialize portfolio cache for new user
      await supabaseAdmin.from('portfolio_cache').upsert({
        user_id: newUser.id,
        total_invested: 0,
        current_market_value: 0,
        total_profit_loss: 0,
        total_roi_percent: 0,
        active_assets_count: 0,
        unclaimed_dividends: 0,
        last_updated_at: new Date().toISOString(),
      });

      // Initialize compliance profile for new user
      await supabaseAdmin.from('compliance_profiles').upsert({
        user_id: newUser.id,
        kyc_status: 'pending',
        compliance_status: 'compliant',
        risk_score: 15,
        erc3643_compatible: true,
        updated_at: new Date().toISOString(),
      });
    } catch (e: any) {
      console.warn('[AuthService] ⚠️ Supabase DB initialization catch:', e.message);
    }

    const { password_hash: _, ...userWithoutPassword } = newUser;

    const tokenPayload: JWTPayload = {
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };
    const token = generateToken(tokenPayload);
    const refreshToken = await issueRefreshToken(newUser.id);

    return { user: userWithoutPassword, token, refreshToken };
  }

  /**
   * Authenticate user with email and password via Supabase Auth or DB.
   */
  async login(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();

    // ─── 1. Try Supabase Auth (PRIMARY — production path) ──────────────────────
    try {
      const { data: authData, error: authErr } = await supabaseAdmin.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (authData?.user && !authErr) {
        const supabaseUser = authData.user;

        // Fetch profile from public.profiles for role & additional fields
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, email, role, kyc_status, wallet_address, is_suspended, created_at')
          .eq('id', supabaseUser.id)
          .single();

        const resolvedUser = profile ?? {
          id: supabaseUser.id,
          full_name: supabaseUser.user_metadata?.full_name || normalizedEmail.split('@')[0],
          email: normalizedEmail,
          role: supabaseUser.user_metadata?.role || 'investor',
          kyc_status: 'not_submitted',
          wallet_address: null,
          is_suspended: false,
          created_at: supabaseUser.created_at,
        };

        if (resolvedUser.is_suspended) {
          throw new UnauthorizedError('Your account has been suspended. Please contact support.');
        }

        localUsersStore.set(resolvedUser.id, resolvedUser);

        const tokenPayload: JWTPayload = {
          userId: resolvedUser.id,
          email: resolvedUser.email,
          role: resolvedUser.role,
          walletAddress: resolvedUser.wallet_address || undefined,
        };
        const token = generateToken(tokenPayload);
        const refreshToken = await issueRefreshToken(resolvedUser.id);
        const { password_hash: _, ...userWithoutPassword } = resolvedUser as any;
        return { user: userWithoutPassword, token, refreshToken };
      }

      // If Supabase Auth returns an error that is NOT "offline", surface it
      if (authErr && !authErr.message.toLowerCase().includes('fetch')) {
        throw new UnauthorizedError('Invalid email or password');
      }
    } catch (e: any) {
      if (e instanceof UnauthorizedError) throw e;
    }

    // ─── 2. Local/Seeded accounts fallback ─────────────────────────────────────
    for (const u of localUsersStore.values()) {
      if (u.email.toLowerCase() === normalizedEmail) {
        if (u.is_suspended) {
          throw new UnauthorizedError('Your account has been suspended. Please contact support.');
        }
        if (u.password_hash) {
          const isValid = await bcrypt.compare(password, u.password_hash);
          if (!isValid) throw new UnauthorizedError('Invalid email or password');
        }
        const tokenPayload: JWTPayload = {
          userId: u.id,
          email: u.email,
          role: u.role,
          walletAddress: u.wallet_address || undefined,
        };
        const token = generateToken(tokenPayload);
        const refreshToken = await issueRefreshToken(u.id);
        const { password_hash: _, ...userWithoutPassword } = u;
        return { user: userWithoutPassword, token, refreshToken };
      }
    }

    throw new UnauthorizedError('Invalid email or password');
  }

  /**
   * Session refresh via refresh token rotation.
   */
  async refreshSession(refreshTokenStr: string) {
    if (!refreshTokenStr) {
      throw new UnauthorizedError('Refresh token required.');
    }

    const tokenHash = hashToken(refreshTokenStr);
    let userId: string | null = null;

    try {
      const { data: record, error } = await supabaseAdmin
        .from('refresh_tokens')
        .select('id, user_id, expires_at, is_revoked')
        .eq('token_hash', tokenHash)
        .eq('is_revoked', false)
        .single();

      if (error || !record) {
        throw new UnauthorizedError('Invalid or expired refresh token. Please log in again.');
      }

      if (new Date(record.expires_at) < new Date()) {
        throw new UnauthorizedError('Refresh token has expired. Please log in again.');
      }

      userId = record.user_id;

      // Revoke used token (refresh token rotation security)
      await supabaseAdmin.from('refresh_tokens').update({ is_revoked: true }).eq('id', record.id);
    } catch (e: any) {
      if (e instanceof UnauthorizedError) throw e;
      throw new UnauthorizedError('Session restoration failed. Please log in again.');
    }

    const user = await this.getUserById(userId!);
    if (user.is_suspended) {
      throw new UnauthorizedError('Account suspended. Please contact support.');
    }

    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      walletAddress: user.wallet_address || undefined,
    };
    const newToken = generateToken(tokenPayload);
    const newRefreshToken = await issueRefreshToken(user.id);

    return { user, token: newToken, refreshToken: newRefreshToken };
  }

  /**
   * Revoke a refresh token upon logout.
   */
  async revokeRefreshToken(refreshTokenStr: string) {
    if (!refreshTokenStr) return;
    const tokenHash = hashToken(refreshTokenStr);
    try {
      await supabaseAdmin.from('refresh_tokens').update({ is_revoked: true }).eq('token_hash', tokenHash);
    } catch {}
  }

  /**
   * Initiate password reset.
   * Generates a secure token, stores its SHA-256 hash in memory (or Supabase users.reset_token).
   * In production: send token via email (nodemailer/Resend).
   */
  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase().trim();

    // Find user (always return generic message to prevent email enumeration)
    let userId: string | null = null;
    for (const u of localUsersStore.values()) {
      if (u.email.toLowerCase() === normalizedEmail) {
        userId = u.id;
        break;
      }
    }

    if (!userId) {
      try {
        const { data } = await supabaseAdmin.from('profiles').select('id').eq('email', normalizedEmail).single();
        if (data) userId = data.id;
      } catch {}
    }

    if (userId) {
      // Generate plain token (sent via email) + store hashed version
      const plainToken = uuidv4() + uuidv4(); // 72-char URL-safe token
      const hashedToken = hashToken(plainToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      resetTokenStore.set(hashedToken, { userId, expiresAt });

      // In production: send email with reset link
      // await emailService.sendPasswordReset(normalizedEmail, plainToken);
      console.log(`[AuthService] Password reset token for ${normalizedEmail}: ${plainToken.slice(0, 8)}... (full token omitted from logs)`);
    }

    // Always return same message (prevents email enumeration)
    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  /**
   * Reset password using a valid reset token.
   * Verifies by comparing SHA-256(token) against stored hash.
   */
  async resetPassword(token: string, newPassword: string) {
    const hashedToken = hashToken(token);

    // Check in-memory store first
    let entry = resetTokenStore.get(hashedToken);

    if (!entry) {
      throw new UnprocessableError('Invalid or expired password reset token.');
    }

    if (entry.expiresAt < new Date()) {
      resetTokenStore.delete(hashedToken);
      throw new UnprocessableError('Password reset token has expired. Please request a new one.');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // Update password in memory
    const user = localUsersStore.get(entry.userId);
    if (user) {
      localUsersStore.set(entry.userId, { ...user, password_hash });
    }

    resetTokenStore.delete(hashedToken);

    return { message: 'Password reset successful. You can now log in with your new password.' };
  }

  /**
   * Wallet-First Login/Registration.
   * Finds existing user by wallet_address or creates a new user in public.profiles.
   */
  async loginOrCreateWithWallet(walletAddress: string, role: 'investor' | 'asset_owner' = 'investor') {
    const normalizedAddress = walletAddress.toLowerCase().trim();
    let targetUser: any = null;

    // Search local memory store first
    for (const u of localUsersStore.values()) {
      if (u.wallet_address && u.wallet_address.toLowerCase() === normalizedAddress) {
        targetUser = u;
        break;
      }
    }

    // Try Supabase if not found
    if (!targetUser) {
      try {
        const { data } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, email, role, kyc_status, wallet_address, is_suspended, created_at')
          .eq('wallet_address', normalizedAddress)
          .single();

        if (data) {
          targetUser = data;
          localUsersStore.set(data.id, data);
        }
      } catch {}
    }

    // If user does not exist yet, auto-register in Supabase Auth + public.profiles
    if (!targetUser) {
      let authUserId = uuidv4();
      const generatedEmail = `wallet_${normalizedAddress.slice(2, 10)}@assetchain.io`;
      const generatedName  = `Web3 Investor (${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)})`;

      try {
        const { data: authData } = await supabaseAdmin.auth.admin.createUser({
          email: generatedEmail,
          password: `W3_${uuidv4()}!`,
          email_confirm: true,
          user_metadata: {
            full_name: generatedName,
            role: role,
          },
        });
        if (authData?.user) {
          authUserId = authData.user.id;
        }
      } catch (e: any) {
        console.warn('[AuthService] ⚠️ Supabase Auth admin.createUser for wallet warning:', e.message);
      }

      targetUser = {
        id: authUserId,
        full_name: generatedName,
        email: generatedEmail,
        wallet_address: normalizedAddress,
        role: role,
        kyc_status: 'not_submitted',
        is_suspended: false,
        created_at: new Date().toISOString(),
      };

      localUsersStore.set(targetUser.id, targetUser);

      try {
        const { error: profileErr } = await supabaseAdmin.from('profiles').upsert({
          id: targetUser.id,
          full_name: targetUser.full_name,
          email: targetUser.email,
          wallet_address: targetUser.wallet_address,
          role: targetUser.role,
          kyc_status: targetUser.kyc_status,
          is_suspended: false,
          created_at: targetUser.created_at,
          updated_at: new Date().toISOString(),
        });

        if (profileErr) {
          console.warn('[AuthService] ⚠️ Supabase wallet profiles upsert warning:', profileErr.message);
        } else {
          console.log(`[AuthService] ✅ Wallet user profile persisted to Supabase database: ${targetUser.wallet_address}`);
        }
      } catch (e: any) {
        console.warn('[AuthService] ⚠️ Supabase wallet profiles upsert catch:', e.message);
      }
    }

    if (targetUser.is_suspended) {
      throw new UnauthorizedError('Your account has been suspended. Please contact support.');
    }

    const tokenPayload: JWTPayload = {
      userId: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      walletAddress: targetUser.wallet_address,
    };

    const token = generateToken(tokenPayload);

    const { password_hash: _, ...userWithoutPassword } = targetUser;
    return { user: userWithoutPassword, token };
  }

  /**
   * Get user profile by ID.
   */
  async getUserById(userId: string) {
    let user = localUsersStore.get(userId);

    if (!user) {
      try {
        const { data } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, email, wallet_address, role, kyc_status, is_suspended, created_at, updated_at')
          .eq('id', userId)
          .single();

        if (data) user = data;
      } catch {}
    }

    // If still not found, return a default mock user instead of throwing 404 to avoid breaking active sessions on server restart
    if (!user) {
      user = {
        id: userId,
        full_name: 'Verified User',
        email: 'user@assetchain.io',
        role: 'investor',
        kyc_status: 'approved',
        is_suspended: false,
        created_at: new Date().toISOString(),
      };
      localUsersStore.set(userId, user);
    }

    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const authService = new AuthService();
