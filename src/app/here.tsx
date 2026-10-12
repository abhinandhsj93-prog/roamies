import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PersonaAvatar } from '@/components/PersonaAvatar';
import { useAuth } from '@/lib/auth';
import { cardShadow, colors, fonts, fontSizes, radii, sideMargin } from '@/theme/tokens';

// Placeholder for the Here screen (design/canvas/Here.dc.html). Built out in Weeks 2 to 4.
export default function Here() {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.kicker}>You're in</Text>
      <Text style={styles.place} accessibilityRole="header">
        Mattancherry
      </Text>
      <Text style={styles.meta}>Kochi, Kerala</Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <PersonaAvatar persona="meera" size={40} />
          <Text style={styles.cardName}>
            Meera <Text style={styles.cardRole}>· your local friend</Text>
          </Text>
        </View>
        <Text style={styles.body}>
          Hey, you're in Mattancherry! This is where Kochi's spice trade began, and on a warm day the lanes still smell
          of ginger. Funny thing: the Dutch Palace down the road was built by the Portuguese.
        </Text>
      </View>

      <Text style={styles.meta}>
        {user ? `Signed in as ${user.displayName ?? user.email}` : 'Looking around as a guest'}
      </Text>
      {user && (
        <Pressable onPress={signOut} accessibilityRole="button">
          <Text style={styles.link}>Sign out</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream, paddingHorizontal: sideMargin, paddingTop: 24, gap: 8 },
  kicker: { fontFamily: fonts.medium, fontSize: fontSizes.body, color: colors.ink, opacity: 0.7 },
  place: { fontFamily: fonts.bold, fontSize: fontSizes.display, color: colors.ink },
  meta: { fontFamily: fonts.medium, fontSize: fontSizes.caption, color: colors.ink, opacity: 0.6 },
  card: { marginVertical: 24, padding: 24, gap: 16, borderRadius: radii.card, backgroundColor: colors.white, ...cardShadow },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardName: { fontFamily: fonts.bold, fontSize: fontSizes.body, color: colors.ink },
  cardRole: { fontFamily: fonts.medium, opacity: 0.6 },
  body: { fontFamily: fonts.medium, fontSize: fontSizes.body, lineHeight: 26, color: colors.ink },
  link: { fontFamily: fonts.bold, fontSize: fontSizes.body, color: colors.ink, textDecorationLine: 'underline' },
});
