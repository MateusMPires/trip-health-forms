// "Minhas Viagens" home: trips grouped by start-date month, each section an
// inset grouped card (name, traveler count, chevron) navigating to the trip
// summary. Joining a trip lives in the header (+) and in the empty state.
import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { SectionTitle } from '@/components/GroupedCard';
import { ListItem } from '@/components/ListItem';
import { listTrips, type TripListItem } from '@/db/daos';
import { TRIP_STATUS_LABELS } from '@/lib/format';
import { useMirrorQuery, useSync } from '@/features/sync/SyncProvider';
import { useTheme } from '@/theme';

import { sectionsByMonth } from './sections';

function tripSubtitle(trip: TripListItem): string | null {
  return trip.status === 'active' ? null : TRIP_STATUS_LABELS[trip.status];
}

export function TripsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { status, syncNow } = useSync();
  const trips = useMirrorQuery(() => listTrips(), []);
  const sections = useMemo(() => sectionsByMonth(trips ?? []), [trips]);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(trip) => trip.id}
      contentInsetAdjustmentBehavior="automatic"
      stickySectionHeadersEnabled={false}
      style={{ backgroundColor: theme.colors.groupedBackground }}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={status === 'syncing'}
          onRefresh={() => void syncNow()}
          tintColor={theme.colors.secondaryText}
        />
      }
      ListHeaderComponent={
        status === 'error' ? (
          <View style={styles.banner}>
            <Text style={[styles.bannerText, { color: theme.colors.secondaryText }]}>
              Sem conexão — mostrando dados offline.
            </Text>
          </View>
        ) : null
      }
      ListEmptyComponent={
        trips == null ? null : (
          <EmptyState
            icon="airplane-outline"
            title="Nenhuma viagem"
            message="Informe o código de acesso recebido do administrador para entrar na viagem."
          >
            <Link href="/trips/join" asChild>
              <Pressable>
                {({ pressed }) => (
                  <View
                    style={[
                      styles.joinButton,
                      { backgroundColor: theme.colors.text, opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Ionicons name="key-outline" size={18} color={theme.colors.background} />
                    <Text style={[styles.joinButtonLabel, { color: theme.colors.background }]}>
                      Entrar com código
                    </Text>
                  </View>
                )}
              </Pressable>
            </Link>
          </EmptyState>
        )
      }
      renderSectionHeader={({ section }) => <SectionTitle>{section.title}</SectionTitle>}
      renderItem={({ item, index, section }) => {
        const isFirst = index === 0;
        const isLast = index === section.data.length - 1;
        return (
          <View
            style={[
              { backgroundColor: theme.colors.card },
              isFirst && styles.cardTop,
              isLast && styles.cardBottom,
            ]}
          >
            <ListItem
              title={item.name}
              subtitle={tripSubtitle(item)}
              trailing={
                <View style={styles.trailing}>
                  <Text style={[styles.count, { color: theme.colors.secondaryText }]}>
                    {item.traveler_count}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={theme.colors.tertiaryText}
                  />
                </View>
              }
              isLast={isLast}
              onPress={() => router.push(`/trips/${item.id}`)}
            />
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  banner: {
    paddingTop: 16,
  },
  bannerText: {
    fontSize: 13,
  },
  cardTop: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardBottom: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
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
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 24,
    height: 50,
  },
  joinButtonLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
});
