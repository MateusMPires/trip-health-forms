import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@viagem/supabase';
import { AppState } from 'react-native';

import { getSupabaseAnonKey, getSupabaseUrl } from './env';
import { secureStoreSessionAdapter } from './secure-store';

// Single client for the whole app. Session lives in Keychain/Keystore and
// auto-refreshes while the app is foregrounded (unlike the anonymous web form).
export const supabase = createClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
  auth: {
    storage: secureStoreSessionAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresh tokens only while the app is active (Supabase's recommended RN setup).
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
