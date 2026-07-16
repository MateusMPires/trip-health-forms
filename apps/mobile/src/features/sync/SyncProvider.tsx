// Sync orchestration for the UI: exposes syncNow(), the current status/progress
// and a dataVersion counter that mirror-backed queries subscribe to. Syncs on app
// open (when online) and on pull-to-refresh — no background sync in this phase.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DependencyList,
  type ReactNode,
} from 'react';

import { clearSyncCursors, getLastSyncedAt } from '@/db/daos';

import { prefetchDocumentBinaries } from '../documents/cache';
import { runSync, type SyncProgress } from './engine';

export type SyncStatus = 'idle' | 'syncing' | 'error';

export type SyncOptions = {
  /**
   * Drop the incremental cursors and re-pull everything. Required after
   * join_trip (the new trip's rows predate the cursors). A full resync is never
   * coalesced away: if a sync is already in flight, it queues behind it.
   */
  fullResync?: boolean;
};

export type SyncResult = { ok: boolean };

type SyncContextValue = {
  status: SyncStatus;
  lastSyncedAt: string | null;
  /** Step-by-step progress of the in-flight sync (null when idle). */
  progress: SyncProgress | null;
  /** Bumped after every sync (and after the background document prefetch). */
  dataVersion: number;
  syncNow: (options?: SyncOptions) => Promise<SyncResult>;
};

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const running = useRef<Promise<SyncResult> | null>(null);
  const prefetching = useRef(false);

  // Best-effort binary prefetch, off the sync critical path: the mirror is
  // already usable, so screens unblock while documents download behind it.
  const prefetchInBackground = useCallback(() => {
    if (prefetching.current) return;
    prefetching.current = true;
    prefetchDocumentBinaries()
      .then(() => setDataVersion((version) => version + 1))
      .catch(() => {})
      .finally(() => {
        prefetching.current = false;
      });
  }, []);

  const syncNow = useCallback(
    async (options?: SyncOptions): Promise<SyncResult> => {
      const fullResync = options?.fullResync ?? false;
      // Coalesce plain syncs into the in-flight one; a full resync instead
      // queues behind it so it is never silently dropped.
      if (running.current && !fullResync) return running.current;

      const previous = running.current;
      const run = (async (): Promise<SyncResult> => {
        if (previous) await previous;
        setStatus('syncing');
        try {
          if (fullResync) await clearSyncCursors();
          await runSync(setProgress);
          setLastSyncedAt(await getLastSyncedAt());
          setStatus('idle');
          prefetchInBackground();
          return { ok: true };
        } catch {
          // Most likely offline — the mirror keeps serving reads. No details
          // are logged on purpose (never log sensitive data).
          setStatus('error');
          return { ok: false };
        } finally {
          setProgress(null);
          // Even a failed sync may have applied some tables before the error.
          setDataVersion((version) => version + 1);
        }
      })();

      running.current = run;
      try {
        return await run;
      } finally {
        if (running.current === run) running.current = null;
      }
    },
    [prefetchInBackground],
  );

  useEffect(() => {
    getLastSyncedAt()
      .then(setLastSyncedAt)
      .catch(() => {});
    void syncNow();
  }, [syncNow]);

  const value = useMemo(
    () => ({ status, lastSyncedAt, progress, dataVersion, syncNow }),
    [status, lastSyncedAt, progress, dataVersion, syncNow],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) throw new Error('useSync must be used within SyncProvider');
  return context;
}

/**
 * Reads from the local mirror and re-runs automatically after each sync.
 * `queryFn` must be stable with respect to `deps`.
 */
export function useMirrorQuery<T>(queryFn: () => Promise<T>, deps: DependencyList): T | null {
  const { dataVersion } = useSync();
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    let alive = true;
    queryFn()
      .then((result) => {
        if (alive) setData(result);
      })
      .catch(() => {
        // Mirror not ready yet (first run) — the next dataVersion bump retries.
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, dataVersion]);

  return data;
}
