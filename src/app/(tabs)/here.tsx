import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { PersonaAvatar } from '@/components/PersonaAvatar';
import { TAB_BAR_SPACE } from '@/components/TabBar';
import { DirectionsButton, Pill, PrimaryButton, StatusText } from '@/components/ui';
import type { Legend, Mood, Spot, Tip } from '@/content/types';
import { Illustration } from '@/illustrations/Illustration';
import { useCurrentPlace } from '@/lib/useCurrentPlace';
import { useTemperature } from '@/lib/useTemperature';
import { cardShadow, colors, fonts, fontSizes, radii, sideMargin } from '@/theme/tokens';

// Here: the guide screen, from design/canvas/Here.dc.html.
const HERO_HEIGHT = 368;
const SPOT_CARD_WIDTH = 216;
const LEGEND_CARD_WIDTH = 280;
const CARD_GAP = 16;

const moods: { id: Mood; label: string }[] = [
  { id: 'show-me-around', label: 'Show me around' },
  { id: 'somewhere-to-chill', label: 'Somewhere to chill' },
  { id: 'surprise-me', label: 'Surprise me' },
];

export default function Here() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { place, loading, loadingName } = useCurrentPlace();
  // loadingName is null or a name only while a new guide is being written by the API.
  const writingGuide = loading && loadingName !== undefined;
  const temperature = useTemperature(place.coords.latitude, place.coords.longitude);
  const [mood, setMood] = useState<Mood | null>(null);

  const heroHeight = HERO_HEIGHT + insets.top;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={{ height: heroHeight, overflow: 'hidden' }}>
        <View style={StyleSheet.absoluteFill}>
          <Illustration
            id={place.hero}
            width={width}
            height={heroHeight}
            preserveAspectRatio="xMidYMax slice"
            accessibilityLabel={`Illustration of ${place.name}`}
          />
        </View>

        {/* Search with Help nearby at its end, so the hero illustration stays clear. */}
        <View style={[styles.search, { top: insets.top + 16 }]}>
          <Pressable
            style={styles.searchField}
            accessibilityRole="search"
            onPress={() =>
              Alert.alert('More places soon', "I'm still learning the rest of Kochi. Fort Kochi is next!")
            }
          >
            <Icon name="search" size={20} color={colors.ink} />
            <Text style={styles.searchPlaceholder} numberOfLines={1}>
              Search another place
            </Text>
          </Pressable>
          <View style={styles.searchDivider} />
          <Pressable
            onPress={() => router.push('/essentials')}
            accessibilityRole="button"
            accessibilityLabel="Help nearby"
            hitSlop={8}
            style={({ pressed }) => [styles.helpButton, pressed && { opacity: 0.7 }]}
          >
            <View style={styles.helpDot}>
              <Icon name="plus" size={12} color={colors.white} strokeWidth={3.4} />
            </View>
            <Text style={styles.helpLabel}>Help</Text>
          </Pressable>
        </View>

        <View style={styles.heroText}>
          <Text style={styles.kicker}>You're in</Text>
          <Text style={styles.placeName} accessibilityRole="header">
            {place.name}
          </Text>
          <Text style={styles.area}>
            {place.area}
            {temperature !== null ? ` · ${temperature}°C` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.main}>
        {/* Meera's briefing */}
        <View style={{ gap: 16 }}>
          {writingGuide && (
            <View style={[styles.card, styles.writing]}>
              <ActivityIndicator color={colors.ink} />
              <Text style={styles.writingText}>
                Meera is getting to know {loadingName ?? 'where you are'}. The first visit takes about a minute.
              </Text>
            </View>
          )}
          <View style={[styles.card, styles.briefing]}>
            <View style={styles.personaRow}>
              <PersonaAvatar persona="meera" size={40} />
              <Text style={styles.personaName}>
                Meera <Text style={styles.personaRole}>· your local friend</Text>
              </Text>
            </View>
            <Text style={styles.briefingText}>{place.briefing}</Text>

            <Pressable
              style={({ pressed }) => [styles.readMore, pressed && { opacity: 0.85 }]}
              onPress={() => router.push({ pathname: '/story', params: { place: place.id } })}
              accessibilityRole="link"
            >
              <View style={styles.thumbs}>
                {place.story.slice(0, 3).map((slide, i) => (
                  <View
                    key={slide.id}
                    style={[styles.thumb, { backgroundColor: slide.background, marginLeft: i === 0 ? 0 : -14 }]}
                  >
                    <Illustration id={slide.illustration} width={36} height={36} preserveAspectRatio="xMidYMid slice" />
                  </View>
                ))}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.readMoreTitle}>Read more: the story of {place.name}</Text>
                <Text style={styles.readMoreMeta}>{place.story.length} short parts · 2 min</Text>
              </View>
              <Icon name="chevron-right" size={18} color={colors.ink} strokeWidth={2.4} />
            </Pressable>

            <PrimaryButton
              label="Plan my morning"
              height={48}
              onPress={() => router.navigate('/plan')}
              trailing={<Icon name="arrow-right" size={18} color={colors.white} strokeWidth={2.4} />}
            />
          </View>

          <View style={styles.pills} accessibilityLabel="Or tell Meera what you feel like">
            <Pill label="I'm hungry" accent onPress={() => router.push({ pathname: '/hungry', params: { place: place.id } })} />
            {moods.map((m) => (
              <Pill
                key={m.id}
                label={m.label}
                selected={mood === m.id}
                onPress={() => setMood(mood === m.id ? null : m.id)}
              />
            ))}
          </View>

          {mood && (
            <View style={styles.moodReply} accessibilityLiveRegion="polite">
              <PersonaAvatar persona="meera" size={32} />
              <View style={styles.moodBubble}>
                <Text style={styles.moodText}>{place.moodReplies[mood]}</Text>
              </View>
            </View>
          )}
        </View>

        {/* See this first */}
        <Section title={'See this first'} aside={place.seeFirst.caption}>
          <CardRow cardWidth={SPOT_CARD_WIDTH}>
            {place.seeFirst.spots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} />
            ))}
          </CardRow>
        </Section>

        {/* What locals say */}
        <Section title="What locals say">
          <CardRow cardWidth={LEGEND_CARD_WIDTH}>
            {place.legends.map((legend, i) => (
              <LegendCard key={legend.id} legend={legend} dark={i % 2 === 0} />
            ))}
          </CardRow>
        </Section>

        {/* Good to know */}
        <Section title="Good to know">
          {place.tips.map((tip) => (
            <TipRow key={tip.id} tip={tip} />
          ))}
        </Section>

        <Text style={styles.sources}>{place.sources}</Text>
      </View>
    </ScrollView>
  );
}

function Section({ title, aside, children }: { title: string; aside?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 16 }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {title}
        </Text>
        {aside && <Text style={styles.sectionAside}>{aside}</Text>}
      </View>
      {children}
    </View>
  );
}

// Horizontal row that bleeds to the screen edges and snaps card by card.
function CardRow({ cardWidth, children }: { cardWidth: number; children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={cardWidth + CARD_GAP}
      decelerationRate="fast"
      style={{ marginHorizontal: -sideMargin }}
      contentContainerStyle={{ paddingHorizontal: sideMargin, paddingBottom: 8, gap: CARD_GAP }}
    >
      {children}
    </ScrollView>
  );
}

function SpotCard({ spot }: { spot: Spot }) {
  return (
    <View style={[styles.spotCard, { backgroundColor: spot.cardColor }]}>
      <Illustration id={spot.illustration} width={184} height={136} />
      <Text style={styles.spotName}>{spot.name}</Text>
      <Text style={styles.spotDetail}>{spot.detail}</Text>
      <View style={styles.spotFooter}>
        <StatusText status={spot.status} />
        <DirectionsButton destination={spot.mapsQuery} label={spot.name} />
      </View>
    </View>
  );
}

function LegendCard({ legend, dark }: { legend: Legend; dark: boolean }) {
  return (
    <View style={[styles.legendCard, dark ? styles.legendDark : styles.legendLight]}>
      <Text style={[styles.legendWhere, { color: dark ? '#F2B77A' : colors.warning }]}>{legend.where}</Text>
      <Text style={[styles.legendTitle, dark && { color: colors.white }]}>{legend.title}</Text>
      <Text style={[styles.legendBody, dark && { color: colors.white }]}>{legend.body}</Text>
    </View>
  );
}

function TipRow({ tip }: { tip: Tip }) {
  const sun = tip.icon === 'sun';
  return (
    <View style={styles.tipRow}>
      <View style={[styles.tipIcon, { backgroundColor: sun ? 'rgba(232,163,61,0.16)' : colors.inkSubtle }]}>
        <Icon name={tip.icon} size={22} color={sun ? colors.warning : colors.ink} strokeWidth={2} />
      </View>
      <Text style={styles.tipText}>
        <Text style={{ fontFamily: fonts.bold }}>{tip.title}</Text> <Text style={{ opacity: 0.7 }}>{tip.body}</Text>
      </Text>
    </View>
  );
}

const glass = 'rgba(255,255,255,0.9)';
const softShadow = { boxShadow: '0 4px 16px rgba(18,48,44,0.12)' } as const;

const styles = StyleSheet.create({
  writing: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: colors.sand },
  writingText: { flex: 1, fontFamily: fonts.medium, fontSize: fontSizes.caption, lineHeight: 20, color: colors.ink },
  screen: { flex: 1, backgroundColor: colors.cream },

  search: {
    position: 'absolute',
    left: sideMargin,
    right: sideMargin,
    height: 48,
    borderRadius: 24,
    backgroundColor: glass,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 16,
    paddingRight: 12,
    ...softShadow,
  },
  searchField: { flex: 1, height: '100%', flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchDivider: { width: 1, height: 24, backgroundColor: colors.ink, opacity: 0.15 },
  helpButton: { height: '100%', flexDirection: 'row', alignItems: 'center', gap: 6 },
  helpDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpLabel: { fontFamily: fonts.bold, fontSize: fontSizes.caption, color: colors.ink },
  searchPlaceholder: { flex: 1, fontFamily: fonts.medium, fontSize: fontSizes.body, color: colors.ink, opacity: 0.6 },
  heroText: { position: 'absolute', left: sideMargin, right: sideMargin, bottom: 56 },
  kicker: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.caption,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.white,
    opacity: 0.8,
  },
  placeName: {
    marginTop: 4,
    fontFamily: fonts.bold,
    fontSize: fontSizes.display,
    lineHeight: 35,
    letterSpacing: -0.5,
    color: colors.white,
  },
  area: { marginTop: 4, fontFamily: fonts.medium, fontSize: fontSizes.body, color: colors.white, opacity: 0.8 },

  main: { marginTop: -32, paddingHorizontal: sideMargin, gap: 48 },
  card: { backgroundColor: colors.white, borderRadius: radii.card, ...cardShadow },
  briefing: { padding: 24, gap: 16 },
  personaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  personaName: { fontFamily: fonts.bold, fontSize: fontSizes.body, color: colors.ink },
  personaRole: { fontFamily: fonts.medium, opacity: 0.6 },
  briefingText: { fontFamily: fonts.medium, fontSize: fontSizes.body, lineHeight: 26, color: colors.ink, opacity: 0.85 },
  readMore: {
    marginTop: -4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(232,163,61,0.16)',
  },
  thumbs: { flexDirection: 'row' },
  thumb: { width: 36, height: 36, borderRadius: 10, overflow: 'hidden', borderWidth: 2, borderColor: colors.white },
  readMoreTitle: { fontFamily: fonts.bold, fontSize: fontSizes.caption, color: colors.ink },
  readMoreMeta: { fontFamily: fonts.medium, fontSize: fontSizes.caption, color: colors.ink, opacity: 0.7 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moodReply: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  moodBubble: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    padding: 16,
    ...cardShadow,
  },
  moodText: { fontFamily: fonts.medium, fontSize: fontSizes.body, lineHeight: 24, color: colors.ink },

  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: fonts.bold, fontSize: fontSizes.title, color: colors.ink },
  sectionAside: { fontFamily: fonts.medium, fontSize: fontSizes.caption, color: colors.ink, opacity: 0.6 },

  spotCard: { width: SPOT_CARD_WIDTH, borderRadius: radii.card, padding: 16, gap: 8 },
  spotName: { fontFamily: fonts.bold, fontSize: fontSizes.body, color: colors.ink },
  spotDetail: { fontFamily: fonts.medium, fontSize: fontSizes.caption, lineHeight: 20, color: colors.ink, opacity: 0.7 },
  spotFooter: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  legendCard: { width: LEGEND_CARD_WIDTH, borderRadius: radii.card, padding: 24, gap: 8 },
  legendDark: { backgroundColor: colors.ink },
  legendLight: { backgroundColor: colors.white, ...cardShadow },
  legendWhere: { fontFamily: fonts.bold, fontSize: fontSizes.caption },
  legendTitle: { fontFamily: fonts.bold, fontSize: fontSizes.title, lineHeight: 26, color: colors.ink },
  legendBody: { fontFamily: fonts.medium, fontSize: fontSizes.body, lineHeight: 24, color: colors.ink, opacity: 0.8 },

  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  tipIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tipText: { flex: 1, fontFamily: fonts.medium, fontSize: fontSizes.body, lineHeight: 24, color: colors.ink },

  sources: { fontFamily: fonts.medium, fontSize: fontSizes.caption, lineHeight: 20, color: colors.ink, opacity: 0.6 },
});
