// Root layout: session restore + auth-gated route groups. No UI here beyond the
// gate — screens live in src/features/*.
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';

import { SessionProvider, useSession } from '@/features/auth/SessionProvider';
import { useTheme } from '@/theme';

function RootNavigator() {
  const { session, restoring } = useSession();
  const theme = useTheme();

  // Navigation theme following the color scheme: native-stack paints headers
  // with these colors when a screen has no explicit headerStyle (the react-
  // navigation default is light-only, which left headers white in dark mode).
  const navigationTheme = useMemo(() => {
    const base = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.text,
        background: theme.colors.background,
        card: theme.colors.background,
        text: theme.colors.text,
        border: theme.colors.separator,
      },
    };
  }, [theme]);

  // Keep the splash visible while the persisted session is restored.
  if (restoring) return null;

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Protected guard={session != null}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={session == null}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </SessionProvider>
  );
}
