import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { PersonaAvatar, PersonaId } from '@/components/PersonaAvatar';
import { useAuth } from '@/lib/auth';
import { cardShadow, colors, fonts, fontSizes, radii, sideMargin } from '@/theme/tokens';

// Welcome screen, from design/canvas/Main.dc.html (artboard 412 wide).
const HERO_HEIGHT = 470;

const greetings: {
  persona: PersonaId;
  hello: string;
  who: string;
  left: number;
  top: number;
  size: number;
  avatarSide: 'left' | 'right';
}[] = [
  { persona: 'kenji', hello: 'Konnichiwa!', who: 'Kenji · Kyoto', left: 24, top: 56, size: 56, avatarSide: 'left' },
  { persona: 'lucia', hello: '¡Hola!', who: 'Lucía · Seville', left: 196, top: 150, size: 56, avatarSide: 'right' },
  { persona: 'meera', hello: 'Namaskaram!', who: 'Meera · Kerala', left: 32, top: 250, size: 64, avatarSide: 'left' },
  { persona: 'amara', hello: 'Jambo!', who: 'Amara · Nairobi', left: 214, top: 340, size: 52, avatarSide: 'right' },
];

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const { signInWithGoogle } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  async function onGoogle() {
    setSigningIn(true);
    try {
      if (await signInWithGoogle()) router.replace('/here');
    } catch (e) {
      Alert.alert("Couldn't sign in", e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.hero, { paddingTop: insets.top }]}>
        <Svg style={StyleSheet.absoluteFill} viewBox={`0 0 412 ${HERO_HEIGHT}`} preserveAspectRatio="none" accessible={false}>
          <Defs>
            <LinearGradient id="heroSky" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#F7D9A8" />
              <Stop offset="0.6" stopColor="#F6E7CF" />
              <Stop offset="1" stopColor={colors.cream} />
            </LinearGradient>
          </Defs>
          <Rect width="412" height={HERO_HEIGHT} fill="url(#heroSky)" />
          <G fill="none" stroke="#E8C48E" strokeWidth={1.5} strokeDasharray="3 7" strokeLinecap="round">
            <Path d="M90 120 C160 60 250 70 300 130" />
            <Path d="M300 150 C330 220 300 280 230 300" />
            <Path d="M200 320 C140 330 90 300 80 240" />
          </G>
          <G fill={colors.turmeric}>
            <Circle cx={90} cy={120} r={4} />
            <Circle cx={300} cy={140} r={4} />
            <Circle cx={230} cy={300} r={4} />
            <Circle cx={80} cy={236} r={4} />
          </G>
        </Svg>
        {greetings.map((g) => (
          <View
            key={g.persona}
            style={[
              styles.greeting,
              { left: `${(g.left / 412) * 100}%`, top: g.top + insets.top },
              g.avatarSide === 'right' && styles.greetingReverse,
            ]}
          >
            <View style={styles.avatarRing}>
              <PersonaAvatar persona={g.persona} size={g.size} />
            </View>
            <View style={[styles.bubble, g.avatarSide === 'left' ? styles.bubbleFromLeft : styles.bubbleFromRight]}>
              <Text style={styles.bubbleHello}>{g.hello}</Text>
              <Text style={styles.bubbleWho}>{g.who}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.main, { paddingBottom: 32 + insets.bottom }]}>
        <View style={{ gap: 8 }}>
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <Svg width={22} height={22} viewBox="0 0 24 24" accessible={false}>
                <Path
                  d="M12 2a7 7 0 00-7 7c0 5.3 7 13 7 13s7-7.7 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z"
                  fill={colors.turmeric}
                />
              </Svg>
            </View>
            <Text style={styles.brand} accessibilityRole="header">
              Roamies
            </Text>
          </View>
          <Text style={styles.tagline}>Friendly neighborhood travel guides.</Text>
          <Text style={styles.description}>
            Roamies are your AI travel friends. Open the app anywhere and a local friend from that place tells you
            what's special, what to eat and where to go next.
          </Text>
        </View>

        <View style={{ gap: 8 }}>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.85 }]}
            onPress={onGoogle}
            disabled={signingIn}
            accessibilityRole="button"
          >
            {signingIn ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <View style={styles.googleBadge}>
                  <Text style={styles.googleG}>G</Text>
                </View>
                <Text style={styles.primaryLabel}>Continue with Google</Text>
              </>
            )}
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => router.replace('/here')} accessibilityRole="button">
            <Text style={styles.secondaryLabel}>Look around first</Text>
          </Pressable>
          <Text style={styles.privacy}>We only use your name and email. Location is used only while the app is open.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  hero: { height: HERO_HEIGHT, overflow: 'hidden' },
  greeting: { position: 'absolute', flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  greetingReverse: { flexDirection: 'row-reverse' },
  avatarRing: { borderRadius: 999, borderWidth: 4, borderColor: colors.white, ...cardShadow },
  bubble: { backgroundColor: colors.white, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, ...cardShadow },
  bubbleFromLeft: { borderBottomLeftRadius: 4 },
  bubbleFromRight: { borderBottomRightRadius: 4 },
  bubbleHello: { fontFamily: fonts.bold, fontSize: fontSizes.body, color: colors.ink },
  bubbleWho: { fontFamily: fonts.medium, fontSize: fontSizes.caption, color: colors.ink, opacity: 0.6 },
  main: { flex: 1, paddingHorizontal: sideMargin, paddingTop: 16, justifyContent: 'space-between', gap: 32 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { fontFamily: fonts.bold, fontSize: fontSizes.display, letterSpacing: -0.5, color: colors.ink },
  tagline: { fontFamily: fonts.bold, fontSize: fontSizes.title, lineHeight: 27, marginTop: 8, color: colors.ink },
  description: { fontFamily: fonts.medium, fontSize: fontSizes.body, lineHeight: 26, color: colors.ink, opacity: 0.75 },
  primaryButton: {
    height: 56,
    borderRadius: radii.button,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: { fontFamily: fonts.bold, fontSize: fontSizes.caption, color: colors.ink },
  primaryLabel: { fontFamily: fonts.bold, fontSize: fontSizes.body, color: colors.white },
  secondaryButton: { height: 56, borderRadius: radii.button, alignItems: 'center', justifyContent: 'center' },
  secondaryLabel: { fontFamily: fonts.bold, fontSize: fontSizes.body, color: colors.ink },
  privacy: {
    marginTop: 8,
    fontFamily: fonts.medium,
    fontSize: fontSizes.caption,
    lineHeight: 20,
    color: colors.ink,
    opacity: 0.6,
    textAlign: 'center',
  },
});
