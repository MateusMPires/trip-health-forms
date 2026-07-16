// Card button on the traveler detail that opens the health sheet. Disabled (no
// chevron, no press) while the traveler hasn't submitted the health form.
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SectionTitle } from '@/components/GroupedCard';
import { useTheme } from '@/theme';

type Props = {
  hasRecord: boolean;
  onPress: () => void;
};

export function HealthButton({ hasRecord, onPress }: Props) {
  const theme = useTheme();
  return (
    <>
      <SectionTitle>Saúde</SectionTitle>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ver informações de saúde"
        disabled={!hasRecord}
        onPress={onPress}
      >
        {({ pressed }) => (
          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.card, opacity: pressed ? 0.5 : 1 },
            ]}
          >
            <View style={[styles.icon, { backgroundColor: theme.colors.input }]}>
              <Ionicons name="medkit" size={18} color={theme.colors.text} />
            </View>
            <View style={styles.text}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                Informações de saúde
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.secondaryText }]}>
                {hasRecord ? 'Ficha enviada' : 'Ficha não enviada'}
              </Text>
            </View>
            {hasRecord ? (
              <Ionicons name="chevron-forward" size={17} color={theme.colors.tertiaryText} />
            ) : null}
          </View>
        )}
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontSize: 17,
  },
  subtitle: {
    fontSize: 13,
  },
});
