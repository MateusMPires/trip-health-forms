// Traveler detail — Contacts-style card: big initials avatar, name, quick actions,
// then grouped cards for personal data, guardians and consents; health lives in its
// own sheet and each document opens from a card button, both in the health-button style.
import Ionicons from '@expo/vector-icons/Ionicons';
import { CONSENT_KINDS, isMinor } from '@viagem/core';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { CardRow, GroupedCard, SectionTitle } from '@/components/GroupedCard';
import { EmptyState } from '@/components/EmptyState';
import {
  getTraveler,
  listConsents,
  listGuardians,
  getHealthRecord,
} from '@/db/daos';
import type { ConsentRow } from '@/db/types';
import { DocumentsSection } from '@/features/documents/DocumentsSection';
import { HealthButton } from '@/features/health/HealthButton';
import { useMirrorQuery } from '@/features/sync/SyncProvider';
import {
  ageInYears,
  CONSENT_KIND_LABELS,
  formatDate,
  formatName,
  SEX_LABELS,
} from '@/lib/format';
import { useTheme } from '@/theme';

type QuickAction = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  url: string | null;
};

type Guardian = {
  id: string;
  full_name: string;
  relationship: string | null;
  phone: string | null;
  phone_secondary: string | null;
};

function GuardianCard({ guardian }: { guardian: Guardian }) {
  const theme = useTheme();
  const phones = [guardian.phone, guardian.phone_secondary].filter(
    (phone): phone is string => Boolean(phone?.trim()),
  );

  return (
    <View style={[styles.guardianCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.guardianHead}>
        <Text style={[styles.guardianName, { color: theme.colors.text }]}>
          {formatName(guardian.full_name)}
        </Text>
        {guardian.relationship ? (
          <Text style={[styles.guardianRelationship, { color: theme.colors.secondaryText }]}>
            {guardian.relationship}
          </Text>
        ) : null}
      </View>

      {phones.length > 0 ? (
        phones.map((phone, index) => {
          const digits = phone.replace(/\D/g, '');
          return (
            <View
              key={`${guardian.id}-${index}`}
              style={[
                styles.phoneRow,
                { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.separator },
              ]}
            >
              <View style={styles.phoneText}>
                <Text style={[styles.phoneLabel, { color: theme.colors.secondaryText }]}>
                  {index === 0 ? 'telefone' : 'telefone alternativo'}
                </Text>
                <Text style={[styles.phoneValue, { color: theme.colors.text }]}>{phone}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Ligar para ${formatName(guardian.full_name)}`}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.callButton,
                  { backgroundColor: theme.colors.input, opacity: pressed ? 0.5 : 1 },
                ]}
                onPress={() => Linking.openURL(`tel:${digits}`).catch(() => {})}
              >
                <Ionicons name="call" size={15} color={theme.colors.secondaryText} />
              </Pressable>
            </View>
          );
        })
      ) : (
        <View
          style={[
            styles.phoneRow,
            { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.separator },
          ]}
        >
          <Text style={[styles.phoneLabel, { color: theme.colors.tertiaryText }]}>
            Sem telefone cadastrado
          </Text>
        </View>
      )}
    </View>
  );
}

function ConsentCardRow({ consent, isLast }: { consent: ConsentRow; isLast: boolean }) {
  const theme = useTheme();
  const accepted = Boolean(consent.accepted);
  return (
    <View
      style={[
        styles.consentRow,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.separator,
        },
      ]}
    >
      <Ionicons
        name={accepted ? 'checkmark-circle' : 'close-circle'}
        size={24}
        color={accepted ? theme.colors.success : theme.colors.danger}
      />
      <View style={styles.consentText}>
        <Text style={[styles.consentLabel, { color: theme.colors.text }]}>
          {CONSENT_KIND_LABELS[consent.kind] ?? consent.kind}
        </Text>
        <Text
          style={[
            styles.consentStatus,
            accepted
              ? { color: theme.colors.secondaryText }
              : { color: theme.colors.danger, fontWeight: '600' },
          ]}
        >
          {accepted ? `Aceito em ${formatDate(consent.accepted_at)}` : 'Não autorizado'}
        </Text>
      </View>
    </View>
  );
}

function QuickActions({ actions }: { actions: QuickAction[] }) {
  const theme = useTheme();
  return (
    <View style={styles.actions}>
      {actions.map((action) => (
        <Pressable
          key={action.label}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          style={({ pressed }) => [
            styles.action,
            {
              backgroundColor: theme.colors.card,
              opacity: action.url ? (pressed ? 0.5 : 1) : 0.35,
            },
          ]}
          disabled={!action.url}
          onPress={() => action.url && Linking.openURL(action.url).catch(() => {})}
        >
          <Ionicons name={action.icon} size={20} color={theme.colors.text} />
        </Pressable>
      ))}
    </View>
  );
}

export function TravelerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();

  const traveler = useMirrorQuery(() => getTraveler(id), [id]);
  const guardians = useMirrorQuery(() => listGuardians(id), [id]);
  const health = useMirrorQuery(() => getHealthRecord(id), [id]);
  const consents = useMirrorQuery(() => listConsents(id), [id]);

  const today = useMemo(() => new Date(), []);

  if (traveler === null) {
    // Either still loading or not found; the mirror answers fast enough that a
    // spinner would just flash — render nothing until data arrives.
    return <EmptyState title="" />;
  }

  // Canonical kind order (from @viagem/core) beats accepted_at: the list reads the
  // same on every traveler, so a denied authorization is easy to spot by position.
  const sortedConsents = [...(consents ?? [])].sort(
    (a, b) => CONSENT_KINDS.indexOf(a.kind) - CONSENT_KINDS.indexOf(b.kind),
  );

  const minor = isMinor(traveler.birth_date, today);
  const age = traveler.birth_date ? ageInYears(traveler.birth_date, today) : null;
  const phoneDigits = traveler.phone?.replace(/\D/g, '') ?? '';

  const birthValue = traveler.birth_date
    ? `${formatDate(traveler.birth_date)}${age != null ? ` · ${age} anos` : ''}${minor ? ' · menor de idade' : ''}`
    : '—';

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: theme.colors.groupedBackground }}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Avatar name={traveler.full_name} size={96} />
          <Text style={[styles.name, { color: theme.colors.text }]}>
            {formatName(traveler.full_name)}
          </Text>
          {minor ? (
            <Text style={[styles.minor, { color: theme.colors.secondaryText }]}>
              Menor de idade
            </Text>
          ) : null}
        </View>

        <QuickActions
          actions={[
            { icon: 'chatbubble', label: 'mensagem', url: phoneDigits ? `sms:${phoneDigits}` : null },
            { icon: 'call', label: 'ligar', url: phoneDigits ? `tel:${phoneDigits}` : null },
            { icon: 'mail', label: 'e-mail', url: traveler.email ? `mailto:${traveler.email}` : null },
          ]}
        />

        <View style={[styles.divider, { backgroundColor: theme.colors.separator }]} />

        <SectionTitle>Dados pessoais</SectionTitle>
        <GroupedCard>
          <CardRow
            label="celular"
            value={traveler.phone ?? '—'}
            onPress={phoneDigits ? () => Linking.openURL(`tel:${phoneDigits}`).catch(() => {}) : undefined}
          />
          <CardRow
            label="e-mail"
            value={traveler.email ?? '—'}
            onPress={
              traveler.email
                ? () => Linking.openURL(`mailto:${traveler.email}`).catch(() => {})
                : undefined
            }
          />
          <CardRow label="nascimento" value={birthValue} />
          <CardRow label="sexo" value={traveler.sex ? SEX_LABELS[traveler.sex] : '—'} />
          <CardRow label="documento" value={traveler.document ?? '—'} />
          <CardRow label="observações" value={traveler.notes?.trim() || '—'} isLast />
        </GroupedCard>

        {guardians && guardians.length > 0 ? (
          <>
            <SectionTitle>Responsáveis</SectionTitle>
            <View style={styles.guardianList}>
              {guardians.map((guardian) => (
                <GuardianCard key={guardian.id} guardian={guardian} />
              ))}
            </View>
          </>
        ) : null}

        <HealthButton
          hasRecord={health != null}
          onPress={() =>
            router.push({ pathname: '/travelers/[id]/health', params: { id } })
          }
        />

        <DocumentsSection traveler={traveler} />

        {sortedConsents.length > 0 ? (
          <>
            <SectionTitle>Autorizações</SectionTitle>
            <GroupedCard>
              {sortedConsents.map((consent, index) => (
                <ConsentCardRow
                  key={consent.id}
                  consent={consent}
                  isLast={index === sortedConsents.length - 1}
                />
              ))}
            </GroupedCard>
          </>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 20,
  },
  name: {
    fontSize: 26,
    fontWeight: '600',
    textAlign: 'center',
  },
  minor: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 20,
  },
  action: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guardianList: {
    gap: 12,
  },
  guardianCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  guardianHead: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 2,
  },
  guardianName: {
    fontSize: 18,
    fontWeight: '600',
  },
  guardianRelationship: {
    fontSize: 14,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  phoneText: {
    flex: 1,
    gap: 2,
  },
  phoneLabel: {
    fontSize: 13,
  },
  phoneValue: {
    fontSize: 17,
  },
  callButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  consentText: {
    flex: 1,
    gap: 2,
  },
  consentLabel: {
    fontSize: 17,
  },
  consentStatus: {
    fontSize: 13,
  },
});
