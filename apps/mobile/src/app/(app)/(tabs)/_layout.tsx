// Native tab bar (UITabBar / BottomNavigation) — system components, monochrome tint.
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';

import { useTheme } from '@/theme';

export default function TabsLayout() {
  const theme = useTheme();
  return (
    <NativeTabs tintColor={theme.colors.text}>
      <NativeTabs.Trigger name="trips">
        <Label>Viagens</Label>
        {Platform.OS === 'ios' ? (
          <Icon sf="airplane" />
        ) : (
          <Icon src={<VectorIcon family={MaterialIcons} name="flight" />} />
        )}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Label>Ajustes</Label>
        {Platform.OS === 'ios' ? (
          <Icon sf="gearshape.fill" />
        ) : (
          <Icon src={<VectorIcon family={MaterialIcons} name="settings" />} />
        )}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
