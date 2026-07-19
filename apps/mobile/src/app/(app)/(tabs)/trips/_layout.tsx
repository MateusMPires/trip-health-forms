import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/theme';

export default function TripsStackLayout() {
  const theme = useTheme();
  const router = useRouter();
  const openJoin = () => router.push('/trips/join');

  return (
    <Stack
      // Header colors come from the root navigation theme; setting an explicit
      // opaque headerStyle here would be painted over the iOS 26 large title
      // (react-navigation#12707).
      screenOptions={{
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Minhas Viagens',
          headerLargeTitle: true,
          // Native bar button items (unstable_headerRightItems) need a newer
          // react-native-screens than SDK 54's 4.16, so this is a custom view.
          // The fixed square, centered container works around the iOS 26 glass
          // circle misalignment (react-native-screens#2990).
          headerRight: () => (
            <Pressable
              onPress={openJoin}
              hitSlop={8}
              style={styles.headerButton}
              accessibilityLabel="Entrar em uma viagem"
            >
              {({ pressed }) => (
                <Ionicons
                  name="add"
                  size={24}
                  color={theme.colors.text}
                  style={{ opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="[id]/index"
        options={{ title: '', headerBackButtonDisplayMode: 'minimal' }}
      />
      <Stack.Screen
        name="[id]/travelers"
        options={{ title: '', headerBackButtonDisplayMode: 'minimal' }}
      />
      <Stack.Screen
        name="[id]/evangelism/index"
        options={{ title: 'Evangelismo', headerBackButtonDisplayMode: 'minimal' }}
      />
      <Stack.Screen
        name="[id]/evangelism/[date]"
        options={{
          // Native sheet header: the title and the checkmark save action are set
          // from the screen itself (EvangelismDayScreen) so they can read form state.
          presentation: 'formSheet',
          sheetAllowedDetents: [1],
          sheetGrabberVisible: true,
          sheetCornerRadius: 24,
          contentStyle: { backgroundColor: theme.colors.groupedBackground },
        }}
      />
      <Stack.Screen
        name="join"
        options={{ title: 'Entrar em uma viagem', presentation: 'formSheet', headerShown: true }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
