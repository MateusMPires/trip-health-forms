// Plain-list row in the Contacts style: optional avatar, title, hairline separator
// aligned with the text (not the avatar).
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, Text, type TextStyle, View } from 'react-native';

import { useTheme } from '@/theme';

type Props = {
  title: string;
  /** String or nested <Text> spans (spans inherit the subtitle style, may recolor). */
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  isLast?: boolean;
  /** Overrides on the title (e.g. weight for emphasis, muted color). */
  titleStyle?: StyleProp<TextStyle>;
};

export function ListItem({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  isLast,
  titleStyle,
}: Props) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      {({ pressed }) => (
        <View
          style={[
            styles.row,
            { backgroundColor: pressed ? theme.colors.input : 'transparent' },
          ]}
        >
          {leading && <View style={styles.leading}>{leading}</View>}
          <View
            style={[
              styles.body,
              !isLast && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: theme.colors.separator,
              },
            ]}
          >
            <View style={styles.text}>
              <Text
                style={[styles.title, { color: theme.colors.text }, titleStyle]}
                numberOfLines={1}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text
                  style={[styles.subtitle, { color: theme.colors.secondaryText }]}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>
            {trailing}
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
  },
  leading: {
    marginRight: 12,
    marginVertical: 8,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 16,
    minHeight: 44,
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: 17,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 1,
  },
});
