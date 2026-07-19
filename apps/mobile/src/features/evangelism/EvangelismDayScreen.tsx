// Fill/edit the current leader's evangelism report for one trip day. Fully offline:
// the row is written to the mirror and pushed by the sync engine when back online.
// Re-filing a day reuses the existing row id (an edit, not a duplicate).
import Ionicons from '@expo/vector-icons/Ionicons';
import { EVANGELISM_METRIC_KEYS, evangelismReportInputSchema } from '@viagem/core';
import * as Crypto from 'expo-crypto';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SectionTitle } from '@/components/GroupedCard';
import {
  getMyEvangelismReport,
  getTrip,
  getTripMemberRole,
  upsertLocalReport,
} from '@/db/daos';
import { useSession } from '@/features/auth/SessionProvider';
import { useMirrorQuery, useSync } from '@/features/sync/SyncProvider';
import { EVANGELISM_METRIC_LABELS, formatDate } from '@/lib/format';
import { useTheme } from '@/theme';

import { Stepper } from './Stepper';

type Counters = Record<(typeof EVANGELISM_METRIC_KEYS)[number], number>;

const EMPTY_COUNTERS: Counters = {
  approaches: 0,
  gospel_presentations: 0,
  professions_of_faith: 0,
  reconciliations: 0,
  referrals: 0,
  prayer_requests: 0,
};

// "approaches" is the ceiling for every other metric (each counts a subset of the
// people approached). Lowering it pulls the others down so the form stays valid.
function capToApproaches(counters: Counters): Counters {
  const capped = { ...counters };
  for (const key of EVANGELISM_METRIC_KEYS) {
    if (key !== 'approaches') capped[key] = Math.min(capped[key], counters.approaches);
  }
  return capped;
}

export function EvangelismDayScreen() {
  const { id, date } = useLocalSearchParams<{ id: string; date: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { session } = useSession();
  const { syncNow } = useSync();
  const userId = session?.user.id ?? null;

  const trip = useMirrorQuery(() => getTrip(id), [id]);
  const role = useMirrorQuery(
    () => (userId ? getTripMemberRole(id, userId) : Promise.resolve(null)),
    [id, userId],
  );
  const existing = useMirrorQuery(
    () => (userId ? getMyEvangelismReport(id, userId, date) : Promise.resolve(null)),
    [id, userId, date],
  );

  const [counters, setCounters] = useState<Counters>(EMPTY_COUNTERS);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  // Seed the form from the existing report exactly once, so a later sync bump
  // never clobbers in-progress edits.
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current || existing === null) return;
    seeded.current = true;
    setCounters({
      approaches: existing.approaches,
      gospel_presentations: existing.gospel_presentations,
      professions_of_faith: existing.professions_of_faith,
      reconciliations: existing.reconciliations,
      referrals: existing.referrals,
      prayer_requests: existing.prayer_requests,
    });
    setNotes(existing.notes ?? '');
  }, [existing]);

  const canEdit = role === 'group_leader';

  const save = async () => {
    if (!userId || !trip || !canEdit) return;
    const trimmedNotes = notes.trim();
    const parsed = evangelismReportInputSchema.safeParse({
      report_date: date,
      ...counters,
      notes: trimmedNotes.length > 0 ? trimmedNotes : undefined,
    });
    if (!parsed.success) {
      Alert.alert('Não foi possível salvar', 'Confira os números informados e tente novamente.');
      return;
    }

    setSaving(true);
    try {
      await upsertLocalReport({
        id: existing?.id ?? Crypto.randomUUID(),
        organization_id: trip.organization_id,
        trip_id: trip.id,
        author_id: userId,
        report_date: date,
        ...counters,
        notes: trimmedNotes.length > 0 ? trimmedNotes : null,
        timestamp: new Date().toISOString(),
      });
      // Best-effort immediate push; if offline it stays pending for the next sync.
      void syncNow();
      router.back();
    } catch {
      Alert.alert('Não foi possível salvar', 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // Validate first (so invalid input never prompts), then confirm before persisting.
  const onSavePress = () => {
    if (!canEdit) return;
    const trimmedNotes = notes.trim();
    const parsed = evangelismReportInputSchema.safeParse({
      report_date: date,
      ...counters,
      notes: trimmedNotes.length > 0 ? trimmedNotes : undefined,
    });
    if (!parsed.success) {
      Alert.alert('Não foi possível salvar', 'Confira os números informados e tente novamente.');
      return;
    }
    Alert.alert(
      'Salvar relatório?',
      'Os números deste dia serão salvos e enviados quando houver conexão.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salvar', onPress: () => void save() },
      ],
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: formatDate(date),
          // Close on the left, checkmark to save on the right — set here so the
          // action reads the current form state and its saving/enabled flags.
          // Fixed square, centered containers keep the glyphs centered inside the
          // iOS 26 glass header circles (react-native-screens#2990).
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              hitSlop={8}
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              {({ pressed }) => (
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.secondaryText}
                  style={{ opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          ),
          headerRight: canEdit
            ? () => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Salvar relatório"
                  hitSlop={8}
                  onPress={onSavePress}
                  disabled={saving}
                  style={styles.headerButton}
                >
                  {({ pressed }) =>
                    saving ? (
                      <ActivityIndicator color={theme.colors.text} />
                    ) : (
                      <Ionicons
                        name="checkmark"
                        size={24}
                        color={theme.colors.text}
                        style={{ opacity: pressed ? 0.5 : 1 }}
                      />
                    )
                  }
                </Pressable>
              )
            : undefined,
        }}
      />
      <ScrollView
        // The opaque native header already reserves its space; kill every automatic
        // inset so the content sits right under it (the form sheet miscalculates
        // them otherwise). automaticallyAdjustKeyboardInsets replaces the old
        // KeyboardAvoidingView for the notes field, without breaking the layout.
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        automaticallyAdjustKeyboardInsets
        style={[styles.flex, { backgroundColor: theme.colors.groupedBackground }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {trip == null || role == null ? null : !canEdit ? (
          <Text style={[styles.blocked, { color: theme.colors.secondaryText }]}>
            Apenas líderes de grupo podem lançar relatórios de evangelismo.
          </Text>
        ) : (
          <>
            <SectionTitle>Números do dia</SectionTitle>
            <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
              {EVANGELISM_METRIC_KEYS.map((key) => (
                <Stepper
                  key={key}
                  label={EVANGELISM_METRIC_LABELS[key]}
                  value={counters[key]}
                  max={key === 'approaches' ? undefined : counters.approaches}
                  onChange={(next) =>
                    setCounters((prev) =>
                      key === 'approaches'
                        ? capToApproaches({ ...prev, approaches: next })
                        : { ...prev, [key]: next },
                    )
                  }
                />
              ))}
            </View>

            <SectionTitle>Observações</SectionTitle>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Opcional"
              placeholderTextColor={theme.colors.tertiaryText}
              multiline
              style={[
                styles.notes,
                { backgroundColor: theme.colors.card, color: theme.colors.text },
              ]}
            />
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  notes: {
    minHeight: 96,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  blocked: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 48,
    paddingHorizontal: 24,
    lineHeight: 21,
  },
});
