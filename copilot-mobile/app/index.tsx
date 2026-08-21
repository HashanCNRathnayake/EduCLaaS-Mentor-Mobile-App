import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { getSession } from '@/lib/auth';

export default function EntryScreen() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const route = async () => {
      const session = await getSession();
      if (cancelled) return;

      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    };

    route();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#193e6b" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
});
