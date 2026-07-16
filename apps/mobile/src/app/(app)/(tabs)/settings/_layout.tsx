import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

export default function SettingsStackLayout() {
  const theme = useTheme();
  return (
    <Stack
      // Header colors come from the root navigation theme; setting an explicit
      // opaque headerStyle here would be painted over the iOS 26 large title
      // (react-navigation#12707).
      screenOptions={{
        contentStyle: { backgroundColor: theme.colors.groupedBackground },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Ajustes', headerLargeTitle: true }} />
    </Stack>
  );
}
