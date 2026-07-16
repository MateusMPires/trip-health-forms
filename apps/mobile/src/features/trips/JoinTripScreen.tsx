// Join-by-code sheet — the app's single write (RPC join_trip), followed by a
// FULL resync with visible progress: the new trip's rows predate the incremental
// cursors, so only a cursor-reset pull makes them show up. The screen stays put
// until the data has actually landed (or offers retry on failure).
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ProgressBar } from '@/components/ProgressBar';
import { useSync } from '@/features/sync/SyncProvider';
import { SYNC_TABLE_LABELS } from '@/lib/format';
import { useTheme } from '@/theme';

import { joinTrip } from './api';

const CODE_LENGTH = 6;

type Phase = 'code' | 'downloading' | 'download_error';

export function JoinTripScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { syncNow, progress } = useSync();
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<Phase>('code');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = code.trim().length === CODE_LENGTH && !submitting;

  async function downloadTripData() {
    setPhase('downloading');
    const { ok } = await syncNow({ fullResync: true });
    if (ok) {
      router.back();
    } else {
      setPhase('download_error');
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const result = await joinTrip(code);
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    await downloadTripData();
  }

  if (phase === 'downloading') {
    const fraction = progress ? progress.step / progress.totalSteps : 0;
    const stepLabel = progress?.table ? SYNC_TABLE_LABELS[progress.table] : 'Preparando…';
    return (
      <View
        style={[styles.container, styles.centered, { backgroundColor: theme.colors.groupedBackground }]}
      >
        <Text style={[styles.downloadTitle, { color: theme.colors.text }]}>
          Baixando dados da viagem
        </Text>
        <ProgressBar progress={fraction} />
        <Text style={[styles.downloadStep, { color: theme.colors.secondaryText }]}>
          {stepLabel}
        </Text>
      </View>
    );
  }

  if (phase === 'download_error') {
    return (
      <View
        style={[styles.container, styles.centered, { backgroundColor: theme.colors.groupedBackground }]}
      >
        <Text style={[styles.downloadTitle, { color: theme.colors.text }]}>
          Você entrou na viagem, mas o download dos dados falhou
        </Text>
        <Text style={[styles.downloadStep, { color: theme.colors.secondaryText }]}>
          Verifique sua conexão e tente de novo. Você também pode baixar depois, puxando a
          lista de viagens para atualizar.
        </Text>
        <Pressable
          style={[styles.button, styles.fullWidth, { backgroundColor: theme.colors.text }]}
          onPress={() => void downloadTripData()}
        >
          <Text style={[styles.buttonLabel, { color: theme.colors.background }]}>
            Tentar novamente
          </Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={[styles.secondaryLabel, { color: theme.colors.secondaryText }]}>
            Deixar para depois
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.groupedBackground }]}>
      <Text style={[styles.hint, { color: theme.colors.secondaryText }]}>
        Peça o código de {CODE_LENGTH} dígitos ao organizador da viagem.
      </Text>
      <TextInput
        style={[
          styles.codeField,
          { backgroundColor: theme.colors.card, color: theme.colors.text },
        ]}
        placeholder="000000"
        placeholderTextColor={theme.colors.tertiaryText}
        keyboardType="number-pad"
        maxLength={CODE_LENGTH}
        value={code}
        onChangeText={setCode}
        autoFocus
      />
      {error ? <Text style={[styles.error, { color: theme.colors.text }]}>{error}</Text> : null}
      <Pressable
        style={[
          styles.button,
          { backgroundColor: theme.colors.text, opacity: canSubmit ? 1 : 0.4 },
        ]}
        onPress={handleSubmit}
        disabled={!canSubmit}
      >
        {submitting ? (
          <ActivityIndicator color={theme.colors.background} />
        ) : (
          <Text style={[styles.buttonLabel, { color: theme.colors.background }]}>
            Entrar na viagem
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  centered: {
    justifyContent: 'center',
    paddingBottom: 96,
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
  },
  codeField: {
    borderRadius: 12,
    fontSize: 28,
    fontVariant: ['tabular-nums'],
    letterSpacing: 8,
    textAlign: 'center',
    paddingVertical: 16,
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  buttonLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryLabel: {
    fontSize: 15,
  },
  downloadTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  downloadStep: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
