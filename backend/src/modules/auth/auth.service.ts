import { supabaseAdmin, supabaseClient, isSupabaseConfigured } from '../../config/supabase.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error.middleware.js';
import {
  RegisterDTO,
  LoginDTO,
  UpdateProfileDTO,
  UserProfile,
} from '../../types/auth.types.js';

export class AuthService {
  /**
   * Register a new customer account
   * Explicit rule: Role is ALWAYS 'customer'. Public registration cannot select 'admin'.
   */
  async register(data: RegisterDTO) {
    if (!isSupabaseConfigured) {
      throw new AppError(
        'Authentication service is not configured. Please supply SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in backend/.env',
        503
      );
    }

    const { email, password, full_name, company_name } = data;

    if (data.confirm_password && data.password !== data.confirm_password) {
      throw new AppError('Passwords do not match.', 400, 'PASSWORD_MISMATCH');
    }

    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          company_name,
          role: 'customer', // Metadata tag
        },
        emailRedirectTo: `${env.FRONTEND_URL}/auth/callback`,
      },
    });

    if (authError) {
      if (
        authError.message.toLowerCase().includes('already registered') ||
        authError.message.toLowerCase().includes('already exists') ||
        authError.status === 422
      ) {
        throw new AppError(
          'An account with this email address already exists. Please sign in or reset your password.',
          409,
          'DUPLICATE_EMAIL'
        );
      }
      throw new AppError(authError.message, 400);
    }

    // Supabase returns an empty identities array if the user already exists (email enumeration protection)
    if (authData?.user && authData.user.identities && authData.user.identities.length === 0) {
      throw new AppError(
        'An account with this email address already exists. Please sign in or reset your password.',
        409,
        'DUPLICATE_EMAIL'
      );
    }

    if (!authData.user) {
      throw new AppError('Failed to create user account.', 500);
    }

    // 2. Ensure profile exists and is populated in public.profiles table
    const profilePayload = {
      id: authData.user.id,
      email: authData.user.email || email,
      full_name: full_name.trim(),
      company_name: company_name?.trim() || null,
      role: 'customer' as const,
      updated_at: new Date().toISOString(),
    };

    let profile: UserProfile;

    const { data: upsertedProfile, error: upsertError } = await supabaseAdmin
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (upsertError) {
      console.warn('Upsert profile failed, attempting update:', upsertError.message);
      await supabaseAdmin
        .from('profiles')
        .update({
          full_name: full_name.trim(),
          company_name: company_name?.trim() || null,
        })
        .eq('id', authData.user.id);
    }

    // Also sync to auth.users user_metadata
    try {
      await supabaseAdmin.auth.admin.updateUserById(authData.user.id, {
        user_metadata: {
          full_name: full_name.trim(),
          company_name: company_name?.trim() || null,
          role: 'customer',
        },
      });
    } catch (metaErr) {
      console.warn('Could not sync user_metadata:', metaErr);
    }

    profile = (upsertedProfile as UserProfile) || {
      id: authData.user.id,
      email: authData.user.email || email,
      full_name: full_name.trim(),
      company_name: company_name?.trim() || null,
      role: 'customer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return {
      user: profile,
      session: authData.session,
      requiresEmailVerification: !authData.session, // If confirmation is required, session is null initially
      message: authData.session
        ? 'Registration successful.'
        : 'Registration successful. Please check your email to verify your account.',
    };
  }

  /**
   * Log in with Email & Password
   */
  async login(data: LoginDTO) {
    if (!isSupabaseConfigured) {
      throw new AppError(
        'Authentication service is not configured. Please supply SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in backend/.env',
        503
      );
    }

    const { email, password } = data;

    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      if (
        authError.message.toLowerCase().includes('email not confirmed') ||
        authError.message.toLowerCase().includes('not verified')
      ) {
        throw new AppError(
          'Your email address has not been verified yet. Please check your inbox or request a new verification email.',
          403,
          'EMAIL_NOT_VERIFIED'
        );
      }
      if (
        authError.message.toLowerCase().includes('invalid login credentials') ||
        authError.message.toLowerCase().includes('invalid credentials')
      ) {
        throw new AppError('Invalid email or password. Please verify your credentials.', 401, 'INVALID_CREDENTIALS');
      }
      throw new AppError(authError.message, 401);
    }

    if (!authData.user || !authData.session) {
      throw new AppError('Authentication failed. No active session returned.', 401);
    }

    // Explicit check for verified email
    const isConfirmed = Boolean(
      authData.user.email_confirmed_at ||
      authData.user.confirmed_at ||
      (authData.user.identities && authData.user.identities.some((id: any) => id.identity_data?.email_verified))
    );

    if (!isConfirmed) {
      throw new AppError(
        'Your email address has not been verified yet. Please check your inbox or request a new verification email.',
        403,
        'EMAIL_NOT_VERIFIED'
      );
    }

    // 2. Retrieve user profile with verified role
    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    const metaName = authData.user.user_metadata?.full_name || email.split('@')[0];

    // Fallback if profile row is missing in profiles table
    if (!profile) {
      const fallbackProfile: UserProfile = {
        id: authData.user.id,
        email: authData.user.email || email,
        full_name: metaName,
        company_name: authData.user.user_metadata?.company_name || null,
        role: (authData.user.user_metadata?.role as 'customer' | 'admin') || 'customer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      try {
        const { data: createdProfile } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: authData.user.email || email,
            full_name: fallbackProfile.full_name,
            company_name: fallbackProfile.company_name,
            role: 'customer',
          })
          .select()
          .maybeSingle();

        profile = createdProfile || fallbackProfile;
      } catch {
        profile = fallbackProfile;
      }
    } else if (!profile.full_name || profile.full_name.trim() === '') {
      // Self-heal profile if full_name was missed
      profile.full_name = metaName;
      try {
        await supabaseAdmin.from('profiles').update({ full_name: metaName }).eq('id', authData.user.id);
      } catch {
        // Ignore non-fatal update error
      }
    }

    if (!profile) {
      profile = {
        id: authData.user.id,
        email: authData.user.email || email,
        full_name: metaName,
        role: 'customer',
      };
    }

    return {
      user: profile as UserProfile,
      tokens: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
        expires_in: authData.session.expires_in,
      },
    };
  }

  /**
   * Fetch current user profile
   */
  async getProfile(userId: string): Promise<UserProfile> {
    let { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !profile) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (authUser?.user) {
        const metaName = authUser.user.user_metadata?.full_name || authUser.user.email?.split('@')[0] || 'Customer';
        const fallback = {
          id: authUser.user.id,
          email: authUser.user.email || '',
          full_name: metaName,
          company_name: authUser.user.user_metadata?.company_name || null,
          role: (authUser.user.user_metadata?.role as 'customer' | 'admin') || 'customer',
        };
        await supabaseAdmin.from('profiles').upsert(fallback, { onConflict: 'id' });
        return fallback as UserProfile;
      }
      throw new AppError('User profile not found.', 404);
    }

    if (!profile.full_name || profile.full_name.trim() === '') {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      const metaName = authUser?.user?.user_metadata?.full_name || profile.email?.split('@')[0] || 'Customer';
      profile.full_name = metaName;
      await supabaseAdmin.from('profiles').update({ full_name: metaName }).eq('id', userId);
    }

    return profile as UserProfile;
  }

  /**
   * Update customer profile (Role cannot be changed through this endpoint)
   */
  async updateProfile(userId: string, data: UpdateProfileDTO): Promise<UserProfile> {
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (data.full_name !== undefined) updatePayload.full_name = data.full_name;
    if (data.company_name !== undefined) updatePayload.company_name = data.company_name;
    if (data.phone !== undefined) updatePayload.phone = data.phone;
    if (data.avatar_url !== undefined) updatePayload.avatar_url = data.avatar_url;

    const { data: updatedProfile, error } = await supabaseAdmin
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select()
      .single();

    if (error || !updatedProfile) {
      throw new AppError(`Failed to update profile: ${error?.message || 'Unknown error'}`, 400);
    }

    return updatedProfile as UserProfile;
  }

  /**
   * Resend signup email verification link
   */
  async resendVerification(email: string) {
    if (!isSupabaseConfigured) {
      throw new AppError(
        'Authentication service is not configured. Please supply SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in backend/.env',
        503
      );
    }

    const { error } = await supabaseClient.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${env.FRONTEND_URL}/auth/callback`,
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes('rate limit') || error.status === 429) {
        throw new AppError(
          'Too many verification requests. Please wait a few minutes before trying again.',
          429,
          'RATE_LIMIT_EXCEEDED'
        );
      }
      throw new AppError(error.message, 400);
    }

    return {
      message: 'Verification link dispatched. Please check your inbox and spam folder.',
    };
  }

  /**
   * Request Password Reset Email (Forgot Password)
   * Security: Does not leak whether email is registered
   */
  async forgotPassword(email: string) {
    if (!isSupabaseConfigured) {
      throw new AppError(
        'Authentication service is not configured. Please supply SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in backend/.env',
        503
      );
    }

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${env.FRONTEND_URL}/reset-password`,
    });

    if (error) {
      if (error.message.toLowerCase().includes('rate limit') || error.status === 429) {
        throw new AppError(
          'Too many password recovery requests. Please wait a few minutes before trying again.',
          429,
          'RATE_LIMIT_EXCEEDED'
        );
      }
      console.warn('Password reset request error:', error.message);
    }

    return {
      message: 'If an account exists with this email, a password reset link has been dispatched.',
    };
  }

  /**
   * Reset Password with active token/session
   */
  async resetPassword(accessToken: string, newPassword: string, confirmPassword?: string) {
    if (confirmPassword && newPassword !== confirmPassword) {
      throw new AppError('Passwords do not match.', 400, 'PASSWORD_MISMATCH');
    }

    if (!isSupabaseConfigured) {
      throw new AppError(
        'Authentication service is not configured. Please supply SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in backend/.env',
        503
      );
    }

    // Set session with the reset access token
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !userData.user) {
      throw new AppError('Invalid or expired password reset link. Please request a new recovery link.', 400, 'INVALID_TOKEN');
    }

    // Update the password using admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userData.user.id,
      { password: newPassword }
    );

    if (updateError) {
      throw new AppError(updateError.message, 400);
    }

    return {
      message: 'Password has been successfully reset. You may now log in.',
    };
  }

  /**
   * Generate Google OAuth sign-in URL
   */
  async getGoogleOAuthUrl(redirectTo?: string) {
    if (!isSupabaseConfigured) {
      throw new AppError(
        'Authentication service is not configured. Please supply SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in backend/.env',
        503
      );
    }

    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || `${env.FRONTEND_URL}/auth/callback`,
      },
    });

    if (error) {
      throw new AppError(error.message, 400);
    }

    return {
      url: data.url,
    };
  }

  /**
   * Invalidate user session
   */
  async logout(token: string) {
    const { error } = await supabaseAdmin.auth.admin.signOut(token);
    if (error) {
      console.warn('Sign out warning:', error.message);
    }
    return {
      message: 'Logged out successfully.',
    };
  }
}

export const authService = new AuthService();
