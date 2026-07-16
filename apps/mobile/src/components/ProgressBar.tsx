// Determinate progress bar in the app's monochrome language: hairline track,
// ink fill. The fill width animates smoothly toward `progress` (0..1).
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

export function ProgressBar({ progress }: { progress: number }) {
  const theme = useTheme();
  const animated = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: Math.min(Math.max(progress, 0), 1),
      duration: 350,
      useNativeDriver: false, // width is not natively animatable
    }).start();
  }, [animated, progress]);

  return (
    <View style={[styles.track, { backgroundColor: theme.colors.separator }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: theme.colors.text,
            width: animated.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
