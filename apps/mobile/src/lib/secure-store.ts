// Keychain (iOS) / Keystore (Android) access. Holds the SQLCipher key and the
// Supabase session — never the code or plain files.
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { DB_KEY_BYTES, SECURE_STORE_DB_KEY } from './config';

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Returns the hex-encoded SQLCipher key, generating (and persisting) it on first run.
 * The key never leaves the secure enclave storage; it is not derived from user input.
 */
export async function getOrCreateDbEncryptionKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(SECURE_STORE_DB_KEY);
  if (existing) return existing;

  const key = toHex(Crypto.getRandomBytes(DB_KEY_BYTES));
  await SecureStore.setItemAsync(SECURE_STORE_DB_KEY, key);
  return key;
}

/** Storage adapter so supabase-js persists the auth session in secure storage. */
export const secureStoreSessionAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};
