import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { PersonaAvatar } from '@/components/PersonaAvatar';
import { DirectionsButton, Pill, StatusText } from '@/components/ui';
import { getPlace, places } from '@/content/places';
import type { FoodSpot, FoodTag } from '@/content/types';
import { Illustration } from '@/illustrations/Illustration';
import { cardShadow, colors, fonts, fontSizes, sideMargin } from '@/theme/tokens';

// "I'm hungry" bottom sheet, from design/canvas/Hungry.dc.html.
const filters: { tag: FoodTag; label: string }[] = [
  { tag: 'vegetarian', label: 'Vegetarian' },
  { tag: 'mild', label: 'Mild · family' },
  { tag: 'cheap', label: 'Cheap' },
  { tag: 'seafood', label: 'Seafood' },
];

export default function Hungry() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ place?: string }>();
  const place = (params.place && getPlace(params.place)) || places[0];
  const [selected, setSelected] = useState<FoodTag[]>([]);

  const toggle = (tag: FoodTag) =>
    setSelected((s) => (s.includes(tag) ? s.filter((t) => t !== tag) : [...s, tag]));
  const food = place.food.filter((f) => selected.every((t) => f.tags.includes(t)));
  const close = () => router.back();

  return (
    <View style={styles.backdrop}>
      <Pressable style={styles.dismissArea} onPress={close} accessibilityLabel="Close" accessibilityRole="button" />
      <View
        style={[styles.sheet, { paddingBottom: 32 + insets.bottom }]}
        accessibilityViewIsModal
        accessibilityLabel="I'm hungry"
      >
        <View style={styles.handle} />
        <View style={styles.header}>
          <PersonaAvatar persona="meera" size={40} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title} accessibilityRole="header">
              Let's eat!
            </Text>
            <Text style={styles.line}>{place.hungryLine}</Text>
          </View>
          <Pressable onPress={close} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
            <Icon name="close" size={18} color={colors.ink} strokeWidth={2.4} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -sideMargin, flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: sideMargin, gap: 8 }}
          accessibilityLabel="Filter food"
        >
          {filters.map((f) => (
            <Pill key={f.tag} label={f.label} selected={selected.includes(f.tag)} onPress={() => toggle(f.tag)} />
          ))}
        </ScrollView>

        <View style={{ gap: 16 }}>
          {food.map((f) => (
            <FoodCard key={f.id} food={f} />
          ))}
          {food.length === 0 && (
            <Text style={styles.empty}>Nothing nearby matches all of those. Try fewer filters.</Text>
          )}
        </View>
      </View>
    </View>
  );
}

function FoodCard({ food }: { food: FoodSpot }) {
  return (
    <View style={styles.foodCard}>
      <View style={[styles.foodIcon, { backgroundColor: food.iconColor }]}>
        <Illustration id={food.illustration} width={64} height={55} preserveAspectRatio="xMidYMid slice" />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.foodName}>{food.name}</Text>
        <Text style={styles.foodDetail}>{food.detail}</Text>
        <StatusText status={food.status} style={{ marginTop: 4 }} />
      </View>
      <DirectionsButton destination={food.mapsQuery} label={food.name} />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(18,48,44,0.55)', justifyContent: 'flex-end' },
  dismissArea: { flex: 1 },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: sideMargin,
    gap: 24,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(18,48,44,0.2)' },
  header: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  title: { fontFamily: fonts.bold, fontSize: fontSizes.title, color: colors.ink },
  line: { marginTop: 8, fontFamily: fonts.medium, fontSize: fontSizes.body, lineHeight: 26, color: colors.ink, opacity: 0.85 },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.inkSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.white,
    ...cardShadow,
  },
  foodIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodName: { fontFamily: fonts.bold, fontSize: fontSizes.body, color: colors.ink },
  foodDetail: { marginTop: 2, fontFamily: fonts.medium, fontSize: fontSizes.caption, color: colors.ink, opacity: 0.7 },
  empty: { fontFamily: fonts.medium, fontSize: fontSizes.body, color: colors.ink, opacity: 0.7 },
});
