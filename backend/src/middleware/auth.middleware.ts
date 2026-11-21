import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { ApiError } from '../utils/api-error.js';
import { UserProfile } from '../types/auth.types.js';
import { sendError } from '../utils/response.js';

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 401, 'Authentication required. Missing or malformed Bearer token.', 'UNAUTHORIZED');
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      sendError(res, 401, 'Authentication token is empty.', 'UNAUTHORIZED');
      return;
    }

    // Verify token with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authData.user) {
      sendError(res, 401, 'Invalid or expired session token.', 'UNAUTHORIZED');
      return;
    }

    // Enforce email verification for active accounts
    const isConfirmed = Boolean(
      authData.user.email_confirmed_at ||
      authData.user.confirmed_at ||
      (authData.user.identities && authData.user.identities.some((id: any) => id.identity_data?.email_verified))
    );

    if (!isConfirmed) {
      sendError(
        res,
        403,
        'Your email address has not been verified yet. Please check your inbox or request a new verification email.',
        'EMAIL_NOT_VERIFIED'
      );
      return;
    }

    // Fetch corresponding profile with role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      const fallbackProfile: UserProfile = {
        id: authData.user.id,
        email: authData.user.email || '',
        full_name:
          authData.user.user_metadata?.full_name ||
          authData.user.email?.split('@')[0] ||
          'Customer',
        role: 'customer',
        created_at: authData.user.created_at,
        updated_at: authData.user.updated_at || authData.user.created_at,
      };
      req.user = fallbackProfile;
    } else {
      if (!profile.full_name || profile.full_name.trim() === '') {
        profile.full_name =
          authData.user.user_metadata?.full_name ||
          authData.user.email?.split('@')[0] ||
          'Customer';
      }
      req.user = profile as UserProfile;
    }

    next();
  } catch {
    next(ApiError.internal('Internal authentication error'));
  }
};

// Aliases per PRD Level 2
export const requireUser = requireAuth;
