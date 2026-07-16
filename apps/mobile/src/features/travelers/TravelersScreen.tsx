// Travelers of a trip — Contacts-style: native search bar in the header,
// alphabetical sections, name-only rows.
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { ListItem } from '@/components/ListItem';
import { listTravelers } from '@/db/daos';
import { isMinor } from '@viagem/core';
import { useMirrorQuery, useSync } from '@/features/sync/SyncProvider';
import { formatName } from '@/lib/format';
import { useTheme } from '@/theme';

import { travelerAlerts } from './alerts';
import { sectionsByInitial } from './sections';

export function TravelersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { status, syncNow } = useSync();
  const [query, setQuery] = useState('');

  const travelers = useMirrorQuery(() => listTravelers(id), [id]);
  const sections = useMemo(
    () => sectionsByInitial(travelers ?? [], query),
    [travelers, query],
  );
  const today = useMemo(() => new Date(), []);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Viajantes',
          headerSearchBarOptions: {
            placeholder: 'Buscar',
            onChangeText: (event) => setQuery(event.nativeEvent.text),
          },
        }}
      />
      <SectionList
        sections={sections}
        keyExtractor={(traveler) => traveler.id}
        contentInsetAdjustmentBehavior="automatic"
        stickySectionHeadersEnabled
        refreshControl={
          <RefreshControl
            refreshing={status === 'syncing'}
            onRefresh={() => void syncNow()}
            tintColor={theme.colors.secondaryText}
          />
        }
        ListEmptyComponent={
          travelers == null ? null : query ? (
            <EmptyState icon="search-outline" title="Nenhum resultado" />
          ) : (
            <EmptyState
              icon="people-outline"
              title="Nenhum viajante"
              message="Os cadastros feitos pelo formulário da viagem aparecem aqui após a sincronização."
            />
          )
        }
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.secondaryText }]}>
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item, index, section }) => {
          const alert = travelerAlerts(item, isMinor(item.birth_date, today));
          return (
            <ListItem
              title={formatName(item.full_name)}
              subtitle={
                alert && (
                  <>
                    {alert.warning ? (
                      <Text style={{ color: theme.colors.warning }}>{alert.warning}</Text>
                    ) : null}
                    {alert.warning && alert.info ? ' · ' : null}
                    {alert.info}
                  </>
                )
              }
              leading={<Avatar name={item.full_name} size={36} />}
              isLast={index === section.data.length - 1}
              onPress={() => router.push(`/travelers/${item.id}`)}
            />
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
});
