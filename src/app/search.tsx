import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { backToMyLocation, pickPlace } from '@/lib/locationTarget';
import { API_URL } from '@/lib/useCurrentPlace';
import { cardShadow, colors, fonts, fontSizes, sideMargin } from '@/theme/tokens';

// Search: jump to a place Meera already knows, look up any place by name, or go back to
// wherever the phone is.
type IndexEntry = { id: string; name: string; area: string; lat: number; lon: number };

// Fetched once per app run; the list only grows when new guides are seeded.
let indexCache: Promise<IndexEntry[]> | null = null;
function loadIndex() {
  indexCache ??= fetch(`${API_URL}/index`)
    .then((r) => r.json() as Promise<{ places: IndexEntry[] }>)
    .then((b) => b.places ?? [])
    .catch(() => {
      indexCache = null;
      return [];
    });
  return indexCache;
}

const MAX_RESULTS = 30;

export default function Search() {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [index, setIndex] = useState<IndexEntry[] | null>(null);
  const [looking, setLooking] = useState(false);
  const [notFound, setNotFound] = useState<string | null>(null);

  useEffect(() => {
    loadIndex().then(setIndex);
  }, []);

  const query = text.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!index) return [];
    const list = query
      ? index.filter((p) => p.name.toLowerCase().includes(query) || p.area.toLowerCase().includes(query))
      : index;
    // Names that start with the query first, then alphabetical.
    return [...list]
      .sort((a, b) => {
        const as = a.name.toLowerCase().startsWith(query) ? 0 : 1;
        const bs = b.name.toLowerCase().startsWith(query) ? 0 : 1;
        return as - bs || a.name.localeCompare(b.name);
      })
      .slice(0, MAX_RESULTS);
  }, [index, query]);

  const go = (latitude: number, longitude: number, label: string) => {
    pickPlace(latitude, longitude, label);
    router.back();
  };

  const goToMyLocation = () => {
    backToMyLocation();
    router.back();
  };

  // Any place on the map, through the phone's own geocoder.
  const lookUp = async () => {
    const name = text.trim();
    if (!name) return;
    setLooking(true);
    setNotFound(null);
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      const [hit] = granted ? await Location.geocodeAsync(`${name}, India`) : [];
      if (hit) go(hit.latitude, hit.longitude, name);
      else setNotFound(name);
    } catch {
      setNotFound(name);
    } finally {
      setLooking(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Back">
          <Icon name="back" size={22} color={colors.ink} strokeWidth={2.4} />
        </Pressable>
        <View style={styles.field}>
          <Icon name="search" size={20} color={colors.ink} />
          <TextInput
            value={text}
            onChangeText={(t) => {
              setText(t);
              setNotFound(null);
            }}
            onSubmitEditing={lookUp}
            placeholder="Search a town, beach or temple"
            placeholderTextColor="rgba(18,48,44,0.5)"
            style={styles.input}
            autoFocus
            returnKeyType="search"
            autoCorrect={false}
          />
          {text.length > 0 && (
            <Pressable onPress={() => setText('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear">
              <Icon name="close" size={18} color={colors.ink} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={matches}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: sideMargin, paddingBottom: insets.bottom + 32 }}
        ListHeaderComponent={
          <View style={{ gap: 8, paddingTop: 16, paddingBottom: 8 }}>
            <Row icon="locate" title="Use my current location" onPress={goToMyLocation} />
            {query.length > 0 && (
              <Row
                icon="pin"
                title={`Find "${text.trim()}" anywhere`}
                subtitle={notFound ? "Couldn't find that place. Try another spelling." : 'Meera will look it up'}
                onPress={lookUp}
                busy={looking}
              />
            )}
            <Text style={styles.sectionLabel}>{query ? 'Places Meera knows' : 'All places Meera knows'}</Text>
            {index === null && <ActivityIndicator color={colors.ink} style={{ marginTop: 16 }} />}
            {index !== null && matches.length === 0 && (
              <Text style={styles.empty}>
                {index.length === 0 ? "Couldn't load the list. Check your connection." : 'No guide yet. Try "Find anywhere" above.'}
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => go(item.lat, item.lon, item.name)}
            style={({ pressed }) => [styles.result, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.resultName}>{item.name}</Text>
              {!!item.area && <Text style={styles.resultArea}>{item.area}</Text>}
            </View>
            <Icon name="chevron-right" size={18} color={colors.ink} strokeWidth={2.4} />
          </Pressable>
        )}
      />
    </View>
  );
}

function Row({
  icon,
  title,
  subtitle,
  onPress,
  busy,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  busy?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [styles.action, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
    >
      <View style={styles.actionIcon}>
        {busy ? <ActivityIndicator color={colors.ink} /> : <Icon name={icon} size={20} color={colors.ink} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.actionTitle} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && <Text style={styles.actionSubtitle}>{subtitle}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: sideMargin },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  field: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    ...cardShadow,
  },
  input: { flex: 1, height: '100%', fontFamily: fonts.medium, fontSize: fontSizes.body, color: colors.ink },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 20,
    backgroundColor: colors.white,
    ...cardShadow,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(232,163,61,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: { fontFamily: fonts.bold, fontSize: fontSizes.body, color: colors.ink },
  actionSubtitle: { fontFamily: fonts.medium, fontSize: fontSizes.caption, color: colors.ink, opacity: 0.6 },
  sectionLabel: {
    marginTop: 16,
    fontFamily: fonts.bold,
    fontSize: fontSizes.caption,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.ink,
    opacity: 0.6,
  },
  empty: { marginTop: 8, fontFamily: fonts.medium, fontSize: fontSizes.body, color: colors.ink, opacity: 0.7 },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(18,48,44,0.15)',
  },
  resultName: { fontFamily: fonts.bold, fontSize: fontSizes.body, color: colors.ink },
  resultArea: { marginTop: 2, fontFamily: fonts.medium, fontSize: fontSizes.caption, color: colors.ink, opacity: 0.6 },
});
