// Trip summary — intermediate page between the trips list and the travelers
// list: trip name as the native title, a navigation link to the travelers and
// a grouped card with the trip details (status, dates, access code).
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import { CardRow, GroupedCard } from '@/components/GroupedCard';
import { ListItem } from '@/components/ListItem';
import { countTravelers, getTrip, getTripMemberRole } from '@/db/daos';
import { useSession } from '@/features/auth/SessionProvider';
import { TripEvangelismSection } from '@/features/evangelism/TripEvangelismSection';
import { useMirrorQuery, useSync } from '@/features/sync/SyncProvider';
import { formatDate, TRIP_STATUS_LABELS } from '@/lib/format';
import { useTheme } from '@/theme';

export function TripSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { session } = useSession();
  const { status, syncNow } = useSync();
  const userId = session?.user.id ?? null;

  const trip = useMirrorQuery(() => getTrip(id), [id]);
  const travelerCount = useMirrorQuery(() => countTravelers(id), [id]);
  const role = useMirrorQuery(
    () => (userId ? getTripMemberRole(id, userId) : Promise.resolve(null)),
    [id, userId],
  );
  // Group leaders file reports (list at the bottom); admins view the consolidated
  // numbers on a separate screen reached from the card below.
  const isGroupLeader = role === 'group_leader';
  const isAdmin = role === 'administrator';

  return (
    <>
      <Stack.Screen options={{ title: trip?.name ?? '' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: theme.colors.groupedBackground }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={status === 'syncing'}
            onRefresh={() => void syncNow()}
            tintColor={theme.colors.secondaryText}
          />
        }
      >
        {trip == null ? null : (
          <>
            <Collapsible title="Detalhes">
              <GroupedCard>
                <CardRow label="Status" value={TRIP_STATUS_LABELS[trip.status]} />
                <CardRow label="Início" value={formatDate(trip.starts_at)} />
                <CardRow label="Término" value={formatDate(trip.ends_at)} />
                <CardRow label="Código de acesso" value={trip.access_code} isLast />
              </GroupedCard>
            </Collapsible>

            <View style={styles.navSection}>
              <GroupedCard>
                <ListItem
                  title="Missionários"
                  trailing={
                    <View style={styles.trailing}>
                      <Text style={[styles.count, { color: theme.colors.secondaryText }]}>
                        {travelerCount ?? ''}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={theme.colors.tertiaryText}
                      />
                    </View>
                  }
                  isLast={!isAdmin}
                  onPress={() => router.push(`/trips/${trip.id}/travelers`)}
                />
                {isAdmin ? (
                  <ListItem
                    title="Evangelismo"
                    trailing={
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={theme.colors.tertiaryText}
                      />
                    }
                    isLast
                    onPress={() => router.push(`/trips/${trip.id}/evangelism`)}
                  />
                ) : null}
              </GroupedCard>
            </View>

            {isGroupLeader ? <TripEvangelismSection trip={trip} /> : null}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  navSection: {
    marginTop: 22,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 12,
  },
  count: {
    fontSize: 17,
  },
});
