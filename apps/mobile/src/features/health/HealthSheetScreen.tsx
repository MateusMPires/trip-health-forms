// Health sheet — opened from the traveler detail. Renders the full health form
// (typed anchor columns + the structured health_records.data payload, validated
// through @viagem/core — the shared contract, never re-defined here) grouped into
// small thematic sections.
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  healthDataSchema,
  MED_AUTHORIZATION_OPTIONS,
  type HealthData,
  type MedAuthorizationCategory,
} from '@viagem/core';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CardRow, GroupedCard, SectionTitle } from '@/components/GroupedCard';
import { EmptyState } from '@/components/EmptyState';
import { getHealthRecord, getTraveler } from '@/db/daos';
import { toBool } from '@/db/types';
import { useMirrorQuery } from '@/features/sync/SyncProvider';
import {
  ALLERGY_TYPE_LABELS,
  BLOOD_TYPE_LABELS,
  formatName,
  labelOf,
  MED_CATEGORY_LABELS,
  MED_OPTION_LABELS,
  MEDICAL_CONDITION_LABELS,
  MEDICAL_HISTORY_LABELS,
  TRAVEL_HEALTH_HISTORY_LABELS,
} from '@/lib/format';
import { useTheme } from '@/theme';

function parseHealthData(raw: string): HealthData {
  try {
    const result = healthDataSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : {};
  } catch {
    return {};
  }
}

/** "Sim/Não" question → display value: detail when yes, "Não" when no, "—" unanswered. */
function yesNo(flag: number | null, detail: string | null | undefined): string {
  const answer = toBool(flag);
  if (answer == null) return '—';
  if (!answer) return 'Não';
  return detail?.trim() || 'Sim';
}

function joinLabels(values: readonly string[] | undefined, map: Record<string, string>): string {
  if (!values || values.length === 0) return '';
  return values.map((value) => labelOf(map, value)).join(', ');
}

/** Checked entries of a checklist, one per line, or '—' when nothing was marked. */
function listLines(labels: string[]): string {
  return labels.length > 0 ? labels.join('\n') : '—';
}

function SheetHeader({ subtitle }: { subtitle: string }) {
  const theme = useTheme();
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerText}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Ficha de saúde</Text>
        {subtitle ? (
          <Text
            style={[styles.headerSubtitle, { color: theme.colors.secondaryText }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar"
        hitSlop={8}
        style={({ pressed }) => [
          styles.closeButton,
          { backgroundColor: theme.colors.input, opacity: pressed ? 0.5 : 1 },
        ]}
        onPress={() => router.back()}
      >
        <Ionicons name="close" size={18} color={theme.colors.secondaryText} />
      </Pressable>
    </View>
  );
}

export function HealthSheetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();

  const traveler = useMirrorQuery(() => getTraveler(id), [id]);
  const record = useMirrorQuery(() => getHealthRecord(id), [id]);

  const travelerName = traveler ? formatName(traveler.full_name) : '';

  if (!record) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.groupedBackground }]}>
        <SheetHeader subtitle={travelerName} />
        <EmptyState
          icon="medkit-outline"
          title="Ficha não enviada"
          message="Este viajante ainda não preencheu o formulário de saúde."
        />
      </View>
    );
  }

  const data = parseHealthData(record.data);

  const conditionDetail = [
    joinLabels(data.medical_conditions, MEDICAL_CONDITION_LABELS),
    record.medical_conditions?.trim() ?? '',
  ]
    .filter(Boolean)
    .join(' — ');

  const allergyDetail = [
    data.allergy?.type ? labelOf(ALLERGY_TYPE_LABELS, data.allergy.type) : '',
    record.allergies?.trim() ?? '',
  ]
    .filter(Boolean)
    .join(' — ');

  const historyLines = Object.entries(data.medical_history ?? {})
    .filter(([, checked]) => checked === true)
    .map(([key]) => labelOf(MEDICAL_HISTORY_LABELS, key));

  const travelHistoryLines = (data.travel_health_history ?? []).map((value) =>
    labelOf(TRAVEL_HEALTH_HISTORY_LABELS, value),
  );

  const medCategories = Object.keys(MED_AUTHORIZATION_OPTIONS) as MedAuthorizationCategory[];

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.groupedBackground }}
      contentContainerStyle={styles.content}
      nestedScrollEnabled
    >
      <SheetHeader subtitle={travelerName} />

      <SectionTitle>Visão geral</SectionTitle>
      <GroupedCard>
        <CardRow
          label="Tipo sanguíneo"
          value={record.blood_type ? labelOf(BLOOD_TYPE_LABELS, record.blood_type) : '—'}
        />
        <CardRow
          label="Plano de saúde"
          value={yesNo(record.has_health_insurance, record.health_insurance)}
          isLast
        />
      </GroupedCard>

      <SectionTitle>Condições e alergias</SectionTitle>
      <GroupedCard>
        <CardRow
          label="Condições médicas"
          value={yesNo(record.has_medical_conditions, conditionDetail)}
        />
        <CardRow
          label="Alergias"
          value={yesNo(record.has_allergies, allergyDetail)}
          isLast={!data.allergy?.reaction}
        />
        {data.allergy?.reaction ? (
          <CardRow label="Reação alérgica" value={data.allergy.reaction} isLast />
        ) : null}
      </GroupedCard>

      <SectionTitle>Medicações</SectionTitle>
      <GroupedCard>
        <CardRow
          label="Medicação contínua"
          value={yesNo(record.uses_continuous_medication, record.medications)}
        />
        <CardRow
          label="Medicação na viagem"
          value={yesNo(record.needs_medication_on_trip, data.medications_to_carry)}
          isLast
        />
      </GroupedCard>

      <SectionTitle>Restrições e limitações</SectionTitle>
      <GroupedCard>
        <CardRow
          label="Restrição alimentar"
          value={yesNo(record.has_dietary_restriction, record.dietary_restrictions)}
        />
        <CardRow
          label="Limitação física"
          value={yesNo(record.has_physical_limitation, record.physical_limitation_description)}
          isLast
        />
      </GroupedCard>

      <SectionTitle>Histórico</SectionTitle>
      <GroupedCard>
        <CardRow label="Histórico médico" value={listLines(historyLines)} />
        <CardRow label="Histórico em viagens" value={listLines(travelHistoryLines)} isLast />
      </GroupedCard>

      <SectionTitle>Medicamentos autorizados</SectionTitle>
      <GroupedCard>
        {medCategories.map((category, index) => (
          <CardRow
            key={category}
            label={MED_CATEGORY_LABELS[category]}
            value={joinLabels(data.med_authorizations?.[category], MED_OPTION_LABELS) || '—'}
            isLast={index === medCategories.length - 1}
          />
        ))}
      </GroupedCard>

      {record.notes?.trim() ? (
        <>
          <SectionTitle>Observações</SectionTitle>
          <GroupedCard>
            <CardRow label="Observações de saúde" value={record.notes} isLast />
          </GroupedCard>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 15,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
