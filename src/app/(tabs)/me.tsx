import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { PersonaAvatar } from '@/components/PersonaAvatar';
import { useAuth } from '@/lib/auth';
import { colors, fonts, fontSizes, sideMargin } from '@/theme/tokens';

export default function Me() {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.title} accessibilityRole="header">
        Me
      </Text>
      <View style={styles.row}>
        <PersonaAvatar persona="meera" size={40} />
        <View style={styles.bubble}>
          <Text style={styles.body}>
            {user
              ? `Hi ${user.displayName?.split(' ')[0] ?? 'there'}! Your travel map, badges and notes will live here soon.`
              : 'Sign in to save places, leave notes and earn badges. Your travel map will live here soon.'}
          </Text>
        </View>
      </View>
      {user ? (
        <Pressable onPress={signOut} accessibilityRole="button">
          <Text style={styles.link}>Sign out</Text>
        </Pressable>
      ) : (
        <Pressable onPress={() => router.replace('/')} accessibilityRole="button">
          <Text style={styles.link}>Sign in with Google</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream, paddingHorizontal: sideMargin, paddingTop: 24, gap: 24 },
  title: { fontFamily: fonts.bold, fontSize: fontSizes.display, color: colors.ink, letterSpacing: -0.5 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubble: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    padding: 16,
    boxShadow: '0 1px 2px rgba(18,48,44,0.06), 0 8px 24px rgba(18,48,44,0.08)',
  },
  body: { fontFamily: fonts.medium, fontSize: fontSizes.body, lineHeight: 24, color: colors.ink },
  link: { fontFamily: fonts.bold, fontSize: fontSizes.body, color: colors.ink, textDecorationLine: 'underline' },
});
