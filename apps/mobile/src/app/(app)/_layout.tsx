// Authenticated shell: the sync engine mounts here (first sync on open) and the
// traveler detail pushes over the native tabs.
import { Stack } from 'expo-router';

import { SyncProvider } from '@/features/sync/SyncProvider';
import { useTheme } from '@/theme';

export default function AppLayout() {
  const theme = useTheme();
  return (
    <SyncProvider>
      <Stack
        // Header colors come from the root navigation theme (scheme-aware).
        screenOptions={{
          contentStyle: { backgroundColor: theme.colors.groupedBackground },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="travelers/[id]/index"
          options={{ title: '', headerBackButtonDisplayMode: 'minimal', headerTransparent: false }}
        />
        <Stack.Screen
          name="travelers/[id]/health"
          options={{
            presentation: 'formSheet',
            headerShown: false,
            sheetAllowedDetents: [0.8, 1],
            sheetGrabberVisible: true,
            sheetCornerRadius: 24,
            contentStyle: { backgroundColor: theme.colors.groupedBackground },
          }}
        />
      </Stack>
    </SyncProvider>
  );
}
