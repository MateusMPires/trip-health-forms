// Animated disclosure section: a SectionTitle-styled header with a rotating chevron
// that reveals/hides its children. Animation is core RN only (no reanimated) —
// LayoutAnimation for the height delta and Animated for the chevron spin, matching
// ProgressBar.tsx. Respects the system "reduce motion" setting.
import Ionicons from '@expo/vector-icons/Ionicons';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';

import { useTheme } from '@/theme';

// LayoutAnimation needs an explicit opt-in on Android (no-op on iOS).
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  title: string;
  /** Optional trailing content in the header (e.g. a status badge). */
  accessory?: ReactNode;
  defaultExpanded?: boolean;
  children: ReactNode;
};

export function Collapsible({ title, accessory, defaultExpanded = false, children }: Props) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const rotate = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;
  const reduceMotion = useRef(false);

  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (alive) reduceMotion.current = value;
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      reduceMotion.current = value;
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  const toggle = () => {
    const next = !expanded;
    if (reduceMotion.current) {
      rotate.setValue(next ? 1 : 0);
    } else {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      Animated.timing(rotate, {
        toValue: next ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    setExpanded(next);
  };

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={toggle}
        style={({ pressed }) => [styles.header, { opacity: pressed ? 0.5 : 1 }]}
      >
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Ionicons name="chevron-forward" size={15} color={theme.colors.secondaryText} />
        </Animated.View>
        <Text style={[styles.title, { color: theme.colors.secondaryText }]}>{title}</Text>
        <View style={styles.spacer} />
        {accessory}
      </Pressable>
      {expanded ? children : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 22,
    marginBottom: 6,
    marginLeft: 16,
    paddingRight: 16,
  },
  title: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  spacer: {
    flex: 1,
  },
});
