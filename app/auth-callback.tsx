import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../utils/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://margdarshak08.onrender.com';

export default function AuthCallback() {
  const router = useRouter();
  const { checkAuth } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        if (Platform.OS !== 'web') {
          router.replace('/');
          return;
        }
        if (typeof window === 'undefined') return;

        // Google redirects here with ?code=xxx after OAuth consent
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (!code) {
          console.error('No code in URL query params');
          router.replace('/');
          return;
        }

        // Exchange code for session token via backend
        const resp = await fetch(
          `${BACKEND_URL}/api/auth/google/exchange?code=${encodeURIComponent(code)}`,
          { credentials: 'include' }
        );
        if (!resp.ok) {
          console.error('Token exchange failed', await resp.text());
          router.replace('/');
          return;
        }

        const { session_token } = await resp.json();
        await AsyncStorage.setItem('session_token', session_token);
        await checkAuth();

        // Clean up URL
        window.history.replaceState(null, '', window.location.pathname);
        router.replace('/');
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/');
      }
    };

    processAuth();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.saffron} />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cream,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
});
