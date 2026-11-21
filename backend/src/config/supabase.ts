import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

/**
 * Checks whether valid, non-empty Supabase credentials have been configured.
 * Does not accept placeholder strings or empty values.
 */
export const isSupabaseConfigured: boolean = Boolean(
  env.SUPABASE_URL &&
  env.SUPABASE_ANON_KEY &&
  env.SUPABASE_SERVICE_ROLE_KEY &&
  !env.SUPABASE_URL.includes('placeholder') &&
  !env.SUPABASE_ANON_KEY.includes('placeholder') &&
  !env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')
);

/**
 * Creates a safe stub for development/testing when Supabase is not yet configured.
 * Prevents initialization errors ("supabaseUrl is required") while providing descriptive
 * error responses if database operations are attempted without credentials.
 */
const createUnconfiguredStub = (clientType: string): SupabaseClient => {
  return new Proxy({} as SupabaseClient, {
    get(_target, prop) {
      if (prop === 'auth') {
        return {
          signUp: async () => ({
            data: { user: null, session: null },
            error: new Error('Supabase credentials are not configured in backend/.env'),
          }),
          signInWithPassword: async () => ({
            data: { user: null, session: null },
            error: new Error('Supabase credentials are not configured in backend/.env'),
          }),
          getUser: async () => ({
            data: { user: null },
            error: new Error('Supabase credentials are not configured in backend/.env'),
          }),
          resetPasswordForEmail: async () => ({
            data: null,
            error: new Error('Supabase credentials are not configured in backend/.env'),
          }),
          signInWithOAuth: async () => ({
            data: null,
            error: new Error('Supabase credentials are not configured in backend/.env'),
          }),
          admin: {
            signOut: async () => ({ error: null }),
            getUserById: async () => ({
              data: { user: null },
              error: new Error('Supabase credentials are not configured in backend/.env'),
            }),
            updateUserById: async () => ({
              data: { user: null },
              error: new Error('Supabase credentials are not configured in backend/.env'),
            }),
          },
        };
      }
      if (prop === 'from') {
        return () => {
          const chain: any = {
            select: () => chain,
            insert: () => chain,
            update: () => chain,
            delete: () => chain,
            eq: () => chain,
            order: () => chain,
            single: async () => ({
              data: null,
              error: new Error('Supabase credentials are not configured in backend/.env'),
            }),
            then: (resolve: any) =>
              resolve({
                data: null,
                error: new Error('Supabase credentials are not configured in backend/.env'),
              }),
          };
          return chain;
        };
      }
      return () => {
        throw new Error(
          `[Supabase ${clientType}] Operation unavailable: Supabase credentials are not configured in backend/.env`
        );
      };
    },
  });
};

// 1. Browser/Anon Client: respects RLS, used for public catalogue and customer auth
export const supabaseAnon: SupabaseClient = isSupabaseConfigured
  ? createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : createUnconfiguredStub('Anon');

// Backward compatibility alias
export const supabaseClient = supabaseAnon;

// 2. Server/User Client Factory: creates a client scoped to an authenticated user's JWT
export const createSupabaseUserClient = (token: string): SupabaseClient => {
  if (!isSupabaseConfigured) {
    return createUnconfiguredStub('UserClient');
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};

// 3. Admin / Service-Role Client: bypasses RLS for system & administrative tasks
// NEVER expose this client or its key to the frontend.
export const supabaseAdmin: SupabaseClient = isSupabaseConfigured
  ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : createUnconfiguredStub('Admin');
