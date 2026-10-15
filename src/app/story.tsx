import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { PersonaAvatar } from '@/components/PersonaAvatar';
import { PrimaryButton } from '@/components/ui';
import { getPlace, places } from '@/content/places';
import type { StorySlide } from '@/content/types';
import { Illustration } from '@/illustrations/Illustration';
import { colors, fonts, fontSizes, sideMargin } from '@/theme/tokens';

// Story mode ("Read more"), from design/canvas/Story.dc.html: swipe or tap through the slides.
export default function Story() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const params = useLocalSearchParams<{ place?: string }>();
  const place = (params.place && getPlace(params.place)) || places[0];
  const slides = place.story;
  const list = useRef<FlatList<StorySlide>>(null);
  const [index, setIndex] = useState(0);

  const artHeight = Math.min(470, Math.round(height * 0.5)) + insets.top;

  const goTo = (i: number) => {
    if (i < 0 || i >= slides.length) return;
    list.current?.scrollToIndex({ index: i, animated: true });
    setIndex(i);
  };
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  const close = () => router.back();

  return (
    <View style={styles.screen}>
      <FlatList
        ref={list}
        data={slides}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        accessibilityLabel={`The story of ${place.name}`}
        renderItem={({ item, index: i }) => {
          const last = i === slides.length - 1;
          return (
            <View style={{ width, height }} accessibilityLabel={`Part ${i + 1} of ${slides.length}: ${item.title}`}>
              <Pressable
                onPress={() => goTo(i + 1)}
                style={[styles.art, { height: artHeight, backgroundColor: item.background }]}
                accessible={false}
              >
                <View style={styles.artImage}>
                  <Illustration
                    id={item.illustration}
                    width={width}
                    height={Math.min(380, artHeight - 90)}
                    preserveAspectRatio={i === 0 ? 'xMidYMid slice' : 'xMidYMax meet'}
                    accessibilityLabel={item.title}
                  />
                </View>
              </Pressable>
              <View style={[styles.text, { paddingBottom: 40 + insets.bottom }]}>
                <Text style={styles.era}>{item.era}</Text>
                <Text style={styles.title} accessibilityRole="header">
                  {item.title}
                </Text>
                <Text style={styles.body}>{item.body}</Text>
                <View style={{ marginTop: 'auto' }}>
                  {last ? (
                    <View style={{ gap: 8 }}>
                      <PrimaryButton
                        label="Plan my morning"
                        onPress={() => router.navigate('/plan')}
                        trailing={<Icon name="arrow-right" size={18} color={colors.white} strokeWidth={2.4} />}
                      />
                      <Pressable onPress={close} style={styles.back} accessibilityRole="button">
                        <Text style={styles.backLabel}>Back to {place.name}</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.footer}>
                      <Text style={styles.count}>
                        {i + 1} of {slides.length} · swipe or tap
                      </Text>
                      <Pressable
                        onPress={() => goTo(i + 1)}
                        style={({ pressed }) => [styles.next, pressed && { opacity: 0.85 }]}
                        accessibilityRole="button"
                        accessibilityLabel="Next part"
                      >
                        <Icon name="arrow-right" size={22} color={colors.white} strokeWidth={2.4} />
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Progress and controls stay put while slides move underneath. */}
      <View style={[styles.overlay, { top: insets.top + 16 }]} pointerEvents="box-none">
        <View style={styles.progress} accessibilityLabel={`Part ${index + 1} of ${slides.length}`}>
          {slides.map((s, i) => (
            <View key={s.id} style={[styles.bar, { backgroundColor: i <= index ? colors.ink : 'rgba(18,48,44,0.18)' }]} />
          ))}
        </View>
        <View style={styles.controls} pointerEvents="box-none">
          <View style={styles.chip}>
            <PersonaAvatar persona="meera" size={32} />
            <Text style={styles.chipLabel}>Meera tells it</Text>
          </View>
          <Pressable onPress={close} style={styles.close} accessibilityRole="button" accessibilityLabel="Close story">
            <Icon name="close" size={18} color={colors.ink} strokeWidth={2.4} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const glass = 'rgba(255,255,255,0.85)';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  art: { overflow: 'hidden' },
  artImage: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  text: { flex: 1, paddingTop: 32, paddingHorizontal: sideMargin, gap: 12 },
  era: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.caption,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.warning,
  },
  title: { fontFamily: fonts.bold, fontSize: fontSizes.display, lineHeight: 37, letterSpacing: -0.5, color: colors.ink },
  body: { fontFamily: fonts.medium, fontSize: fontSizes.body, lineHeight: 26, color: colors.ink, opacity: 0.85 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { fontFamily: fonts.medium, fontSize: fontSizes.caption, color: colors.ink, opacity: 0.6 },
  next: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: { height: 48, alignItems: 'center', justifyContent: 'center' },
  backLabel: { fontFamily: fonts.bold, fontSize: fontSizes.body, color: colors.ink },
  overlay: { position: 'absolute', left: 16, right: 16, gap: 13 },
  progress: { flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 3, borderRadius: 2 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: {
    height: 40,
    paddingLeft: 4,
    paddingRight: 12,
    borderRadius: 20,
    backgroundColor: glass,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipLabel: { fontFamily: fonts.bold, fontSize: fontSizes.caption, color: colors.ink },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: glass, alignItems: 'center', justifyContent: 'center' },
});
