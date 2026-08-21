/**
 * Tab Layout - configures the tab navigation
 */

import { Tabs } from 'expo-router';
import React from 'react';
import { isEnabled } from '@/config/featureFlags';
// Custom BottomNav is used — native tab bar is hidden. No icons needed here.

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // We're using custom bottom nav
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chat',
        }}
      />
      {isEnabled('explore') && (
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
          }}
        />
      )}
      <Tabs.Screen
        name="saved-notes"
        options={{
          title: 'Saved Notes',
        }}
      />
    </Tabs>
  );
}
