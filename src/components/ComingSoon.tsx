import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, fontSizes, sideMargin } from '@/theme/tokens';

import { PersonaAvatar } from './PersonaAvatar';

export function ComingSoon({ title, line }: { title: string; line: string }) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.row}>
        <PersonaAvatar persona="meera" size={40} />
        <View style={styles.bubble}>
          <Text style={styles.body}>{line}</Text>
        </View>
      </View>
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
});
