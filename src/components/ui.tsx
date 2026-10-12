import { ReactNode } from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';

import type { Status } from '@/content/types';
import { openWalkingDirections } from '@/lib/directions';
import { colors, fonts, fontSizes, radii } from '@/theme/tokens';

import { Icon } from './Icon';

export function DirectionsButton({ destination, label }: { destination: string; label: string }) {
  return (
    <Pressable
      onPress={() => openWalkingDirections(destination)}
      accessibilityRole="link"
      accessibilityLabel={`Directions to ${label}`}
      hitSlop={4}
      style={({ pressed }) => [styles.directions, pressed && styles.pressed]}
    >
      <Icon name="directions" size={18} color={colors.white} strokeWidth={2.4} />
    </Pressable>
  );
}

const statusColor: Record<Status['tone'], string> = {
  open: colors.green,
  warning: colors.warning,
  neutral: colors.ink,
};

export function StatusText({ status, style }: { status: Status; style?: StyleProp<TextStyle> }) {
  return (
    <Text
      style={[
        styles.status,
        { color: statusColor[status.tone] },
        status.tone === 'neutral' && { opacity: 0.7 },
        style,
      ]}
    >
      {status.text}
    </Text>
  );
}

type PillProps = PressableProps & { label: string; selected?: boolean; accent?: boolean; style?: StyleProp<ViewStyle> };

export function Pill({ label, selected, accent, style, ...rest }: PillProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [
        styles.pill,
        accent && styles.pillAccent,
        selected && styles.pillSelected,
        pressed && styles.pressed,
        style,
      ]}
      {...rest}
    >
      <Text style={[styles.pillLabel, selected && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  height = 56,
  trailing,
}: {
  label: string;
  onPress: () => void;
  height?: number;
  trailing?: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.primary, { height, borderRadius: height / 2 }, pressed && styles.pressed]}
    >
      <Text style={styles.primaryLabel}>{label}</Text>
      {trailing}
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },
  directions: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: { fontFamily: fonts.bold, fontSize: fontSizes.caption },
  pill: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    backgroundColor: colors.inkSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillAccent: { backgroundColor: 'rgba(232,163,61,0.16)' },
  pillSelected: { backgroundColor: colors.ink },
  pillLabel: { fontFamily: fonts.bold, fontSize: fontSizes.caption, color: colors.ink },
  primary: {
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryLabel: { fontFamily: fonts.bold, fontSize: fontSizes.body, color: colors.white },
});
