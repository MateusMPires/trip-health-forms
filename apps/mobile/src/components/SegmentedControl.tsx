// iOS-style segmented control: a gray track holding equal-width segments, the
// selected one raised as a card-colored pill. Monochromatic, per the app theme.
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

type Segment<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  segments: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ segments, value, onChange }: Props<T>) {
  const theme = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: theme.colors.input }]}>
      {segments.map((segment) => {
        const selected = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[
              styles.segment,
              selected && { backgroundColor: theme.colors.card },
            ]}
            onPress={() => onChange(segment.value)}
          >
            <Text
              style={[
                styles.label,
                { color: selected ? theme.colors.text : theme.colors.secondaryText },
                selected && styles.labelSelected,
              ]}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: 9,
    padding: 2,
  },
  segment: {
    flex: 1,
    borderRadius: 7,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
  },
  labelSelected: {
    fontWeight: '600',
  },
});
