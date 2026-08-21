import React from 'react';
import { Image, ImageStyle, StyleSheet, View } from 'react-native';

interface AppIconProps {
  size?: number;
  style?: ImageStyle | ImageStyle[];
  accessibilityLabel?: string;
}

export default function AppIcon({ size = 96, style, accessibilityLabel = 'App logo' }: AppIconProps) {
  // The container is flexible; the Image will respect parent's size via maxWidth/maxHeight
  return (
    <View style={styles.container} accessible accessibilityLabel={accessibilityLabel}>
      <Image
        source={require('../assets/logo/claass2saas-mentor-logo.png')}
        style={[styles.icon, { width: size, height: size, maxWidth: '100%', maxHeight: '100%' }, style]}
        accessibilityLabel={accessibilityLabel}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 40,
    height: 40,
  },
});
