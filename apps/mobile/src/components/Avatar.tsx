// Contacts-style initials avatar: plain gray circle, white initials, no color coding.
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0][0].toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

type Props = {
  name: string;
  size?: number;
};

export function Avatar({ name, size = 40 }: Props) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.avatar,
        },
      ]}
    >
      <Text
        style={{
          color: theme.colors.avatarText,
          fontSize: size * 0.42,
          fontWeight: '500',
        }}
      >
        {initialsOf(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
