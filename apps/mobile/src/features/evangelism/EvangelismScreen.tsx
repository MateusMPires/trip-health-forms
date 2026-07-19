// Consolidated evangelism numbers for a trip (visible to group leaders and trip
// admins). Group leaders file their reports from the trip detail screen; this screen
// is the read-only roll-up: trip-wide totals and a per-day breakdown across leaders.
import { EVANGELISM_METRIC_KEYS } from '@viagem/core';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { CardRow, GroupedCard, SectionTitle } from '@/components/GroupedCard';
import {
  getTripMemberRole,
  sumEvangelismByDate,
  type EvangelismDaySummary,
} from '@/db/daos';
import { useSession } from '@/features/auth/SessionProvider';
import { useMirrorQuery, useSync } from '@/features/sync/SyncProvider';
import { EVANGELISM_METRIC_LABELS, formatDate } from '@/lib/format';
import { useTheme } from '@/theme';

export function EvangelismScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { session } = useSession();
  const { status, syncNow } = useSync();
  const userId = session?.user.id ?? null;

  const role = useMirrorQuery(
    () => (userId ? getTripMemberRole(id, userId) : Promise.resolve(null)),
    [id, userId],
  );
  const summary = useMirrorQuery(() => sumEvangelismByDate(id), [id]);

  const canView = role === 'group_leader' || role === 'administrator';

  // Trip-wide totals: sum every day's totals.
  const totals = useMemo(() => sumTotals(summary ?? []), [summary]);

  const refreshControl = (
    <RefreshControl
      refreshing={status === 'syncing'}
      onRefresh={() => void syncNow()}
      tintColor={theme.colors.secondaryText}
    />
  );

  // role resolves quickly from the local mirror; guard against non-members deep-linking.
  if (role != null && !canView) {
    return (
      <>
        <Stack.Screen options={{ title: 'Evangelismo' }} />
        <EmptyState
          icon="lock-closed-outline"
          title="Sem acesso"
          message="Apenas líderes de grupo e administradores da viagem podem ver os relatórios de evangelismo."
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Evangelismo' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: theme.colors.groupedBackground }}
        contentContainerStyle={styles.content}
        refreshControl={refreshControl}
      >
        <SectionTitle>Total da viagem</SectionTitle>
        <GroupedCard>
          {EVANGELISM_METRIC_KEYS.map((key, index) => (
            <CardRow
              key={key}
              label={EVANGELISM_METRIC_LABELS[key]}
              value={String(totals[key])}
              isLast={index === EVANGELISM_METRIC_KEYS.length - 1}
            />
          ))}
        </GroupedCard>

        {summary != null && summary.length > 0 ? (
          <>
            <SectionTitle>Por dia</SectionTitle>
            <GroupedCard>
              {summary.map((day, index) => (
                <CardRow
                  key={day.report_date}
                  label={formatDate(day.report_date)}
                  value={dayHeadline(day)}
                  isLast={index === summary.length - 1}
                />
              ))}
            </GroupedCard>
          </>
        ) : null}
      </ScrollView>
    </>
  );
}

/** Sum every day's totals into a single per-metric total for the trip. */
function sumTotals(summary: readonly EvangelismDaySummary[]) {
  const totals: Record<(typeof EVANGELISM_METRIC_KEYS)[number], number> = {
    approaches: 0,
    gospel_presentations: 0,
    professions_of_faith: 0,
    reconciliations: 0,
    referrals: 0,
    prayer_requests: 0,
  };
  for (const day of summary) {
    for (const key of EVANGELISM_METRIC_KEYS) totals[key] += day[key];
  }
  return totals;
}

/** Compact per-day headline for the "Por dia" list. */
function dayHeadline(day: EvangelismDaySummary): string {
  const leaders = `${day.leader_count} líder${day.leader_count === 1 ? '' : 'es'}`;
  return `${day.professions_of_faith} decisões · ${leaders}`;
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
});
