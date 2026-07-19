// The evangelism report list shown at the bottom of the trip detail screen (group
// leaders only). Trip days are split into two collapsible lists — days available to
// fill (today or past) and days still ahead — with a fill-status affordance per row
// that emphasizes what has not been filled yet. Tapping a day opens the report sheet.
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, type StyleProp, Text, type TextStyle } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import { GroupedCard } from '@/components/GroupedCard';
import { ListItem } from '@/components/ListItem';
import { listMyEvangelismReports } from '@/db/daos';
import type { TripRow } from '@/db/types';
import { useSession } from '@/features/auth/SessionProvider';
import { useMirrorQuery } from '@/features/sync/SyncProvider';
import { formatDate } from '@/lib/format';
import { useTheme, type Theme } from '@/theme';

import { enumerateTripDays, todayIso } from './dates';
import { buildStatusMap, dayNumberMap, dayStatus, splitTripDays, type DayStatus } from './reportList';

export function TripEvangelismSection({ trip }: { trip: TripRow }) {
  const theme = useTheme();
  const router = useRouter();
  const { session } = useSession();
  const userId = session?.user.id ?? null;

  const myReports = useMirrorQuery(
    () => (userId ? listMyEvangelismReports(trip.id, userId) : Promise.resolve([])),
    [trip.id, userId],
  );

  const days = useMemo(
    () => enumerateTripDays(trip.starts_at, trip.ends_at),
    [trip.starts_at, trip.ends_at],
  );
  const today = todayIso(new Date());
  const { available, future } = useMemo(() => splitTripDays(days, today), [days, today]);
  const numbers = useMemo(() => dayNumberMap(days), [days]);
  const statusMap = useMemo(() => buildStatusMap(myReports ?? []), [myReports]);
  const toFillCount = available.filter((day) => dayStatus(statusMap, day) === 'empty').length;

  const openDay = (day: string) => router.push(`/trips/${trip.id}/evangelism/${day}`);

  return (
    <>
      {days.length === 0 ? (
        <Text style={[styles.hint, { color: theme.colors.secondaryText }]}>
          Defina as datas de início e término da viagem para lançar os dias.
        </Text>
      ) : (
        <>
          {available.length > 0 ? (
            <Collapsible
              title="Relatórios Disponíveis"
              accessory={<ToFillBadge count={toFillCount} />}
              defaultExpanded
            >
              <GroupedCard>
                {available.map((day, index) => {
                  const status = dayStatus(statusMap, day);
                  return (
                    <ListItem
                      key={day}
                      title={`Dia ${numbers.get(day)}`}
                      subtitle={formatDate(day)}
                      titleStyle={titleStyleFor(status, theme)}
                      trailing={<ReportTrailing status={status} />}
                      isLast={index === available.length - 1}
                      onPress={() => openDay(day)}
                    />
                  );
                })}
              </GroupedCard>
            </Collapsible>
          ) : null}

          {future.length > 0 ? (
            <Collapsible title="Próximos Relatórios">
              <GroupedCard>
                {future.map((day, index) => (
                  <ListItem
                    key={day}
                    title={`Dia ${numbers.get(day)}`}
                    subtitle={formatDate(day)}
                    titleStyle={{ color: theme.colors.secondaryText }}
                    isLast={index === future.length - 1}
                  />
                ))}
              </GroupedCard>
            </Collapsible>
          ) : null}
        </>
      )}
    </>
  );
}

/** Title emphasis per status: bold when unfilled, muted when done, default otherwise. */
function titleStyleFor(status: DayStatus, theme: Theme): StyleProp<TextStyle> {
  if (status === 'empty') return styles.emptyTitle;
  if (status === 'filled') return { color: theme.colors.secondaryText };
  return undefined;
}

/** Trailing status affordance: a sync-pending icon, a done check, or a "tap to fill" chevron. */
function ReportTrailing({ status }: { status: DayStatus }) {
  const theme = useTheme();
  if (status === 'filled') {
    return <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />;
  }
  if (status === 'pending') {
    return <Ionicons name="cloud-upload-outline" size={18} color={theme.colors.secondaryText} />;
  }
  return <Ionicons name="chevron-forward" size={16} color={theme.colors.tertiaryText} />;
}

/** Header badge for the available list: pending count, or a done check when all filled. */
function ToFillBadge({ count }: { count: number }) {
  const theme = useTheme();
  if (count === 0) {
    return <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />;
  }
  return <Text style={[styles.badge, { color: theme.colors.accent }]}>{count} a preencher</Text>;
}

const styles = StyleSheet.create({
  hint: {
    fontSize: 13,
    marginLeft: 16,
    marginRight: 16,
    lineHeight: 18,
  },
  emptyTitle: {
    fontWeight: '600',
  },
  badge: {
    fontSize: 13,
    fontWeight: '600',
  },
});
