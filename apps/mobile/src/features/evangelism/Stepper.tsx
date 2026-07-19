// A labeled non-negative counter row (−/value/+) for the evangelism form. The value
// is also directly editable via the keyboard for large numbers.
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/theme';

type Props = {
  label: string;
  value: number;
  onChange: (next: number) => void;
  // Optional ceiling: the value can never exceed it (typing or +). Used to cap the
  // funnel metrics at the number of people approached.
  max?: number;
};

export function Stepper({ label, value, onChange, max }: Props) {
  const theme = useTheme();
  const clamp = (n: number) => {
    const floored = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    return max != null ? Math.min(floored, max) : floored;
  };
  const atMax = max != null && value >= max;

  return (
    <View style={[styles.row, { borderBottomColor: theme.colors.separator }]}>
      <Text style={[styles.label, { color: theme.colors.text }]} numberOfLines={2}>
        {label}
      </Text>
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Diminuir ${label}`}
          hitSlop={8}
          onPress={() => onChange(clamp(value - 1))}
          disabled={value <= 0}
        >
          {({ pressed }) => (
            <Ionicons
              name="remove-circle"
              size={28}
              color={value <= 0 ? theme.colors.tertiaryText : theme.colors.text}
              style={{ opacity: pressed ? 0.5 : 1 }}
            />
          )}
        </Pressable>
        <TextInput
          value={String(value)}
          onChangeText={(text) => onChange(clamp(Number(text.replace(/[^0-9]/g, ''))))}
          keyboardType="number-pad"
          selectTextOnFocus
          style={[styles.value, { color: theme.colors.text }]}
          accessibilityLabel={label}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Aumentar ${label}`}
          hitSlop={8}
          onPress={() => onChange(clamp(value + 1))}
          disabled={atMax}
        >
          {({ pressed }) => (
            <Ionicons
              name="add-circle"
              size={28}
              color={atMax ? theme.colors.tertiaryText : theme.colors.text}
              style={{ opacity: pressed ? 0.5 : 1 }}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  label: {
    flex: 1,
    fontSize: 16,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  value: {
    minWidth: 44,
    textAlign: 'center',
    fontSize: 18,
    fontVariant: ['tabular-nums'],
  },
});
