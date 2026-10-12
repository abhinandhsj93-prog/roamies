import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, fontSizes } from '@/theme/tokens';

import { Icon, IconName } from './Icon';

// Floating dark pill bar from the designs: Here, Plan, [Leave a note], Explore, Me.
const tabs: { route: string; label: string; icon: IconName }[] = [
  { route: 'here', label: 'Here', icon: 'pin' },
  { route: 'plan', label: 'Plan', icon: 'calendar' },
  { route: 'explore', label: 'Explore', icon: 'compass' },
  { route: 'me', label: 'Me', icon: 'user' },
];

export const TAB_BAR_SPACE = 72 + 16 + 32; // bar + bottom gap + breathing room above it

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const active = state.routes[state.index]?.name;

  const tab = ({ route, label, icon }: (typeof tabs)[number]) => {
    const focused = active === route;
    const color = focused ? colors.turmeric : 'rgba(255,255,255,0.62)';
    return (
      <Pressable
        key={route}
        style={styles.tab}
        onPress={() => navigation.navigate(route)}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
      >
        <Icon name={icon} size={22} color={color} strokeWidth={2} />
        <Text style={[styles.label, { color, fontFamily: focused ? fonts.bold : fonts.medium }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.bar, { bottom: 16 + insets.bottom }]} accessibilityRole="tablist">
      {tab(tabs[0])}
      {tab(tabs[1])}
      <View style={styles.centerSlot}>
        <Pressable
          style={({ pressed }) => [styles.note, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
          accessibilityLabel="Leave a note here"
          onPress={() => Alert.alert('Memory notes are coming soon', 'Soon you can leave a note at any spot.')}
        >
          <Icon name="pencil" size={24} color={colors.ink} strokeWidth={2.4} />
        </Pressable>
      </View>
      {tab(tabs[2])}
      {tab(tabs[3])}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    boxShadow: '0 12px 32px rgba(18,48,44,0.30)',
  },
  tab: { flex: 1, height: 56, alignItems: 'center', justifyContent: 'center', gap: 4 },
  label: { fontSize: fontSizes.caption },
  centerSlot: { width: 80, alignItems: 'center' },
  note: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginTop: -32,
    backgroundColor: colors.turmeric,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: colors.cream,
    boxSizing: 'content-box',
    boxShadow: '0 10px 20px rgba(232,163,61,0.45)',
  },
});
