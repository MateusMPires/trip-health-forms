// Settings tab: account, sync state and sign-out. Signing out wipes the local
// mirror and document cache (see SessionProvider).
import Constants from 'expo-constants';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';

import { CardRow, GroupedCard, SectionTitle } from '@/components/GroupedCard';
import { useSession } from '@/features/auth/SessionProvider';
import { useSync } from '@/features/sync/SyncProvider';
import { formatDateTime } from '@/lib/format';
import { useTheme } from '@/theme';

export function SettingsScreen() {
  const theme = useTheme();
  const { session, signOut } = useSession();
  const { status, lastSyncedAt, syncNow } = useSync();

  function confirmSignOut() {
    Alert.alert('Sair', 'Os dados sincronizados neste aparelho serão apagados.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void signOut() },
    ]);
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.colors.groupedBackground }}
      contentContainerStyle={styles.content}
    >
      <SectionTitle>Conta</SectionTitle>
      <GroupedCard>
        <CardRow label="e-mail" value={session?.user.email ?? '—'} isLast />
      </GroupedCard>

      <SectionTitle>Sincronização</SectionTitle>
      <GroupedCard>
        <CardRow
          label="última sincronização"
          value={
            status === 'syncing'
              ? 'Sincronizando…'
              : status === 'error'
                ? `Sem conexão · ${formatDateTime(lastSyncedAt)}`
                : formatDateTime(lastSyncedAt)
          }
        />
        <CardRow
          label="ação"
          value="Sincronizar agora"
          onPress={() => void syncNow()}
          isLast
        />
      </GroupedCard>

      <SectionTitle>Sessão</SectionTitle>
      <GroupedCard>
        <CardRow label="sessão" value="Sair" onPress={confirmSignOut} isLast />
      </GroupedCard>

      <Text style={[styles.version, { color: theme.colors.tertiaryText }]}>
        Viagem Missionária — versão {Constants.expoConfig?.version ?? 'dev'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  version: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 32,
  },
});
