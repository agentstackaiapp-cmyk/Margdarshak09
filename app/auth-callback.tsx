import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../utils/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthCallback() {
  const router = useRouter();
  const { setUser, checkAuth } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        if (Platform.OS !== 'web') {
          router.replace('/');
          return;
        }
        if (typeof window === 'undefined') return;

        // Backend redirects to /#session_token=xxx after Google OAuth
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const sessionToken = params.get('session_token');

        if (!sessionToken) {
          console.error('No session_token in URL hash');
          router.replace('/');
          return;
        }

        // Store token and verify with backend
        await AsyncStorage.setItem('session_token', sessionToken);
        await checkAuth();

        // Clear hash from URL
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
