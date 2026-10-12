import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { cardShadow, colors, fonts, fontSizes, sideMargin } from '@/theme/tokens';

// Help nearby. MVP keeps only the emergency card from design/canvas/Essentials.dc.html;
// toilets, pharmacies and hospitals come with live data later.
const numbers = [
  { number: '108', label: 'Ambulance' },
  { number: '100', label: 'Police' },
  { number: '101', label: 'Fire' },
];

const call = (n: string) => Linking.openURL(`tel:${n}`);

export default function Essentials() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Back">
          <Icon name="back" size={22} color={colors.ink} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          Help nearby
        </Text>
      </View>

      <View style={styles.main}>
        <View style={styles.emergency} accessibilityLabel="Emergency">
          <Text style={styles.emergencyKicker}>Emergency · India</Text>
          <Pressable
            onPress={() => call('112')}
            style={({ pressed }) => [styles.call112, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
          >
            <Icon name="phone" size={20} color={colors.white} strokeWidth={2.4} />
            <Text style={styles.call112Label}>Call 112</Text>
          </Pressable>
          <View style={styles.grid}>
            {numbers.map((n) => (
              <Pressable
                key={n.number}
                onPress={() => call(n.number)}
                style={styles.numberTile}
                accessibilityRole="button"
                accessibilityLabel={`Call ${n.number}, ${n.label}`}
              >
                <Text style={styles.number}>{n.number}</Text>
                <Text style={styles.numberLabel}>{n.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.note}>If unsure, call 112.</Text>
        </View>

        <Text style={styles.footnote}>
          Toilets, pharmacies and hospitals near you are coming soon. This app finds places and numbers. It does not give
          medical advice.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: sideMargin, paddingBottom: 8 },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  title: { fontFamily: fonts.bold, fontSize: fontSizes.title, color: colors.ink },
  main: { paddingHorizontal: sideMargin, paddingTop: 16, gap: 32 },
  emergency: { borderRadius: 24, backgroundColor: '#FDECEA', padding: 24, gap: 16 },
  emergencyKicker: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.caption,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.red,
  },
  call112: {
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.red,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    boxShadow: '0 8px 24px rgba(179,38,30,0.3)',
  },
  call112Label: { fontFamily: fonts.bold, fontSize: fontSizes.title, color: colors.white },
  grid: { flexDirection: 'row', gap: 8 },
  numberTile: {
    flex: 1,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { fontFamily: fonts.bold, fontSize: fontSizes.title, color: colors.ink },
  numberLabel: { fontFamily: fonts.medium, fontSize: fontSizes.caption, color: colors.ink, opacity: 0.7 },
  note: { fontFamily: fonts.medium, fontSize: fontSizes.caption, lineHeight: 20, color: colors.ink, opacity: 0.7 },
  footnote: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.caption,
    lineHeight: 20,
    color: colors.ink,
    opacity: 0.6,
    textAlign: 'center',
  },
});
