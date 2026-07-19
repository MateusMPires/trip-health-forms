// Header for a form/detail sheet: a bold title with an optional subtitle and a
// circular close button that dismisses the sheet (router.back()). Shared by the
// health sheet and the evangelism report sheet.
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

type Props = {
  title: string;
  subtitle?: string;
};

export function SheetHeader({ title, subtitle }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text
            style={[styles.subtitle, { color: theme.colors.secondaryText }]}
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

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
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
