// Supabase Auth session state for route guarding, plus sign-in/out. Signing out
// wipes the encrypted mirror and the document cache — no resident data without a
// logged-in leader.
import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { resetLocalDatabase } from '@/db/client';
import { SESSION_RESTORE_TIMEOUT_MS } from '@/lib/config';
import { supabase } from '@/lib/supabase';

import { clearDocumentCache } from '../documents/cache';
import { mapAuthError } from './errors';

type SessionContextValue = {
  session: Session | null;
  /** True while the persisted session is being restored from secure storage. */
  restoring: boolean;
  /** Step 1: email an OTP code to a pre-provisioned leader (no account creation). */
  requestOtp: (email: string) => Promise<{ error: string | null }>;
  /** Step 2: verify the 6-digit code; on success onAuthStateChange sets the session. */
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    let active = true;

    // onAuthStateChange emits INITIAL_SESSION on startup (the reliable way to read
    // the persisted session on React Native) and every change afterwards. getSession()
    // alone can stall on cold start and leave the splash up forever.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      setRestoring(false);
    });

    // Safety net: never hold the splash past the deadline, even if auth init stalls.
    const timer = setTimeout(() => {
      if (active) setRestoring(false);
    }, SESSION_RESTORE_TIMEOUT_MS);

    return () => {
      active = false;
      clearTimeout(timer);
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      restoring,
      requestOtp: async (email) => {
        // shouldCreateUser:false — only pre-provisioned leaders can receive a code.
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        });
        return { error: mapAuthError(error, 'request') };
      },
      verifyOtp: async (email, token) => {
        const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
        return { error: mapAuthError(error, 'verify') };
      },
      signOut: async () => {
        await supabase.auth.signOut();
        await clearDocumentCache();
        await resetLocalDatabase();
      },
    }),
    [session, restoring],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
}
