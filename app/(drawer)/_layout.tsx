/**
 * (drawer)/_layout.tsx
 *
 * Drawer navigator layout. Wraps all screens that appear in the left-slide
 * drawer: (tabs), settings, info, charts. Providers (Theme, AppSettings)
 * remain in the root _layout.tsx — this file only declares routes.
 *
 * Depends on: components/DrawerContent.tsx (custom drawer content)
 * Used by: app/_layout.tsx (root Stack references this segment)
 */

import { Drawer } from 'expo-router/drawer';
import DrawerContent from '@/components/DrawerContent';

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={() => <DrawerContent />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: 'Home',
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: 'Settings',
          title: 'Settings',
        }}
      />
      <Drawer.Screen
        name="info"
        options={{
          drawerLabel: 'Info',
          title: 'MTD Info',
        }}
      />
      <Drawer.Screen
        name="charts"
        options={{
          drawerLabel: 'Charts & Analytics',
          title: 'Charts & Analytics',
        }}
      />
    </Drawer>
  );
}
