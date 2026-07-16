// Opens the encrypted local mirror and applies local migrations. Single connection
// for the whole app; every DAO goes through getDb().
import * as SQLite from 'expo-sqlite';

import { LOCAL_DB_NAME } from '@/lib/config';
import { getOrCreateDbEncryptionKey } from '@/lib/secure-store';

import { LOCAL_MIGRATIONS } from './schema';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  const key = await getOrCreateDbEncryptionKey();
  const db = await SQLite.openDatabaseAsync(LOCAL_DB_NAME);

  // SQLCipher: PRAGMA key must run before anything else touches the database.
  // In a non-SQLCipher runtime (Expo Go) this is a harmless no-op pragma.
  await db.execAsync(`PRAGMA key = "x'${key}'"`);
  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');

  await migrate(db);
  return db;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  for (let version = current; version < LOCAL_MIGRATIONS.length; version += 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(LOCAL_MIGRATIONS[version]);
      await db.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
  }
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  dbPromise ??= openDatabase();
  return dbPromise;
}

/**
 * Drops the whole local mirror (used on sign-out). The mirror is reconstructible
 * from the server, so deleting the database file is always safe.
 */
export async function resetLocalDatabase(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    await db.closeAsync();
    dbPromise = null;
  }
  await SQLite.deleteDatabaseAsync(LOCAL_DB_NAME).catch(() => {
    // Nothing to delete on first run.
  });
}
