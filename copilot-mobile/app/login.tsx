import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  BackHandler,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';

import { getSession, signInWithMicrosoft } from '@/lib/auth';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  const backHandler = BackHandler.addEventListener(
    'hardwareBackPress',
    () => {
      BackHandler.exitApp();
      return true;
    }
  );

  return () => backHandler.remove();
}, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        if (session) {
          router.replace('/(tabs)');
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.info('[Auth] Sign-in button pressed');
    }

    try {
      const session = await signInWithMicrosoft();
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.info('[Auth] Login screen received authenticated session', {
          email: session.email,
        });
      }
      router.replace('/(tabs)');
    } catch (e) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.info('[Auth] Sign-in failed in login screen', {
          error: e instanceof Error ? e.message : 'Authentication failed.',
        });
      }
      setError(e instanceof Error ? e.message : 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#0078D4" />
          <Text style={styles.loadingText}>Checking authentication...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.card, styles.elevatedCard]}>
        <Text style={styles.title}>CLaaS2SaaS</Text>
        <Text style={styles.subtitle}>Sign in with Microsoft Entra ID</Text>

        <TouchableOpacity
          style={[styles.signInButton, isLoading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={isLoading}
          accessibilityLabel="Sign in with Microsoft"
          accessibilityHint="Signs in using your Microsoft organization account">
          <View style={styles.buttonContent}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <View style={styles.microsoftLogo}>
                  <View style={[styles.logoSquare, { backgroundColor: '#F25022' }]} />
                  <View style={[styles.logoSquare, { backgroundColor: '#7FBA00' }]} />
                  <View style={[styles.logoSquare, { backgroundColor: '#00A4EF' }]} />
                  <View style={[styles.logoSquare, { backgroundColor: '#FFB900' }]} />
                </View>
                <Text style={styles.signInButtonText}>Sign in with Microsoft</Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Text style={styles.infoText}>Use your organization account to access the chatbot</Text>
        <Text style={styles.privacyText}>Protected by Microsoft Entra ID</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEE7E0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    alignItems: 'center',
    padding: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1DFDD',
  },
  elevatedCard: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    color: '#193e6b',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 32,
    textAlign: 'center',
    color: '#b3a125',
  },
  signInButton: {
    width: '100%',
    marginBottom: 16,
    backgroundColor: '#193e6b',
    borderColor: '#193e6b',
    borderWidth: 0,
    paddingVertical: 14,
    borderRadius: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  microsoftLogo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 21,
    height: 21,
    marginRight: 12,
  },
  logoSquare: {
    width: 9,
    height: 9,
    margin: 0.5,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    marginBottom: 12,
    textAlign: 'center',
    color: '#E81123',
  },
  infoText: {
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    color: '#605E5C',
  },
  privacyText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#605E5C',
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#605E5C',
  },
});
