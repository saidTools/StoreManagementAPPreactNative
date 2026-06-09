import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useDatabase } from '../hooks/useDatabase';
import { useSettingsStore } from '../store/useSettingsStore';
import { colors, typography } from '../constants/theme';
import { t } from '../i18n';

const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.success,
    error: colors.danger,
    background: colors.background,
    surface: colors.card,
  },
};

export default function RootLayout() {
  const { ready, error } = useDatabase();
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (ready) {
      loadSettings();
      setInitialized(true);
    }
  }, [ready]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>{t('database.error')}</Text>
        <Text style={styles.errorMessage}>{error}</Text>
      </View>
    );
  }

  if (!initialized) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('database.loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="settings/index"
            options={{
              headerShown: true,
              headerTitle: t('settings.title'),
              headerBackTitle: t('common.back'),
              presentation: 'modal',
            }}
          />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 32,
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: 16,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    ...typography.heading3,
    color: colors.danger,
    marginBottom: 8,
  },
  errorMessage: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
