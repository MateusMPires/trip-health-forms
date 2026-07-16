// Grouped detail card in the Contacts style: rounded surface, small secondary label
// above the value, hairline separators between rows.
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

export function GroupedCard({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card }]}>{children}</View>
  );
}

type RowProps = {
  label: string;
  value?: string | null;
  onPress?: () => void;
  /** Renders below the value (e.g. checklist items). */
  children?: ReactNode;
  isLast?: boolean;
};

export function CardRow({ label, value, onPress, children, isLast }: RowProps) {
  const theme = useTheme();
  const content = (
    <View
      style={[
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.separator },
      ]}
    >
      <Text style={[styles.label, { color: theme.colors.secondaryText }]}>{label}</Text>
      {value != null && (
        <Text style={[styles.value, { color: theme.colors.text }]}>{value}</Text>
      )}
      {children}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} android_ripple={{ color: theme.colors.separator }}>
      {({ pressed }) => <View style={pressed ? styles.pressed : undefined}>{content}</View>}
    </Pressable>
  );
}

export function SectionTitle({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text style={[styles.sectionTitle, { color: theme.colors.secondaryText }]}>{children}</Text>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 0,
  },
  label: {
    fontSize: 13,
    marginBottom: 2,
  },
  value: {
    fontSize: 17,
  },
  pressed: {
    opacity: 0.5,
  },
  sectionTitle: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
    marginLeft: 16,
    marginTop: 22,
  },
});
