// Empty/unavailable content placeholder, modeled after iOS ContentUnavailableView:
// optional glyph in a soft circle, title, message, and an optional action slot.
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

type Props = {
  title: string;
  message?: string;
  /** Ionicons glyph rendered above the title. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Action (e.g. a button) rendered below the message. */
  children?: ReactNode;
};

export function EmptyState({ title, message, icon, children }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      {icon ? (
        <View style={[styles.iconCircle, { backgroundColor: theme.colors.card }]}>
          <Ionicons name={icon} size={32} color={theme.colors.secondaryText} />
        </View>
      ) : null}
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      {message ? (
        <Text style={[styles.message, { color: theme.colors.secondaryText }]}>{message}</Text>
      ) : null}
      {children ? <View style={styles.action}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
    gap: 8,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
  },
  action: {
    marginTop: 16,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
});
