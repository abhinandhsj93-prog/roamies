// Open data for one location: the locality name (Nominatim), nearby Wikipedia articles,
// the Wikivoyage article if there is one, and named sights and food spots from OpenStreetMap.

import { wikiPhotos, type Photo } from './photos.ts';

const USER_AGENT = 'Roamies/0.1 (travel guide app; https://github.com/abhinandhsj93-prog/roamies)';

export type Locality = {
  id: string; // stable cache key, e.g. "mattancherry-ernakulam-kerala"
  name: string; // "Mattancherry"
  area: string; // "Kochi, Kerala"
  state: string;
  country: string;
};

export type Poi = {
  name: string;
  kind: string; // "museum", "place_of_worship", "restaurant" ...
  cuisine?: string;
  openingHours?: string;
  diet?: string; // "vegetarian" when tagged diet:vegetarian=yes|only
  walkMinutes: number;
  lat: number;
  lon: number;
};

export type Article = { title: string; text: string; url: string };

export type Sources = {
  locality: Locality;
  wikipedia: Article[];
  wikivoyage?: Article;
  sights: Poi[];
  food: Poi[];
  // Free-licensed photos keyed by Wikipedia article title (the locality's and nearby articles').
  photos: Record<string, Photo>;
  // Fetch failures, kept so a thin guide can be explained (shown by /debug).
  errors: string[];
};

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  // Every source is optional, so a slow one is cut off rather than holding up the guide.
  const res = await fetch(url, {
    ...init,
    headers: { 'User-Agent': USER_AGENT, ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`${new URL(url).host} ${res.status}`);
  return (await res.json()) as T;
}

export function slug(s: string) {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

type NominatimAddress = Record<string, string | undefined>;

export async function reverseGeocode(lat: number, lon: number): Promise<Locality | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&accept-language=en&lat=${lat}&lon=${lon}`;
  const r = await getJson<{ address?: NominatimAddress }>(url);
  const a = r.address;
  if (!a) return null;
  const name =
    // Suburb first: neighbourhoods are often tiny ("Fort Nagar" inside Fort Kochi).
    a.suburb ?? a.quarter ?? a.village ?? a.neighbourhood ?? a.town ?? a.city_district ?? a.city ?? a.county;
  if (!name) return null;
  const city = a.city ?? a.town ?? a.county ?? a.state_district;
  const state = a.state ?? '';
  const country = a.country ?? '';
  const area = [city && city !== name ? city : undefined, state || country].filter(Boolean).join(', ');
  return { id: slug([name, a.state_district ?? city, state].filter(Boolean).join(' ')), name, area, state, country };
}

const walkMinutes = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const cos = Math.cos((lat1 * Math.PI) / 180);
  const metres = Math.hypot((lon2 - lon1) * cos, lat2 - lat1) * 111_320;
  // Streets are not straight lines: 1.3x the crow-flies distance at 80 m a minute.
  return Math.max(1, Math.round((metres * 1.3) / 80));
};

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

type OverpassElement = { lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };

// Asks every Overpass mirror at once and takes the first answer; they are often slow or busy.
async function overpass(query: string): Promise<OverpassElement[]> {
  const r = await Promise.any(
    OVERPASS_ENDPOINTS.map((endpoint) =>
      getJson<{ elements: OverpassElement[] }>(endpoint, { method: 'POST', body: new URLSearchParams({ data: query }) }),
    ),
  );
  return r.elements;
}

function toPois(elements: OverpassElement[], lat: number, lon: number): Poi[] {
  const seen = new Set<string>();
  const pois: Poi[] = [];
  for (const e of elements) {
    const t = e.tags ?? {};
    const pLat = e.lat ?? e.center?.lat;
    const pLon = e.lon ?? e.center?.lon;
    if (!t.name || pLat === undefined || pLon === undefined || seen.has(t.name)) continue;
    seen.add(t.name);
    pois.push({
      name: t['name:en'] ?? t.name,
      kind: t.tourism ?? t.historic ?? t.amenity ?? t.leisure ?? 'place',
      cuisine: t.cuisine,
      openingHours: t.opening_hours,
      diet: /^(yes|only)$/.test(t['diet:vegetarian'] ?? '') ? 'vegetarian' : undefined,
      walkMinutes: walkMinutes(lat, lon, pLat, pLon),
      lat: pLat,
      lon: pLon,
    });
  }
  return pois.sort((a, b) => a.walkMinutes - b.walkMinutes).slice(0, 15);
}

export async function nearbySights(lat: number, lon: number): Promise<Poi[]> {
  const around = `around:1200,${lat},${lon}`;
  return toPois(
    await overpass(`[out:json][timeout:10];
(
  nwr(${around})[name][tourism~"^(attraction|museum|viewpoint|gallery)$"];
  nwr(${around})[name][historic~"^(fort|monument|memorial|building|church|castle|ruins)$"];
  nwr(${around})[name][amenity=place_of_worship];
);
out center tags 60;`),
    lat,
    lon,
  );
}

export async function nearbyFood(lat: number, lon: number): Promise<Poi[]> {
  return toPois(
    await overpass(`[out:json][timeout:10];
node(around:900,${lat},${lon})[name][amenity~"^(restaurant|cafe|fast_food)$"];
out tags 60;`),
    lat,
    lon,
  );
}

type WikiQuery = { query?: { geosearch?: { pageid: number; title: string; lat: number; lon: number }[]; pages?: Record<string, { title: string; extract?: string; fullurl?: string }> } };

async function extracts(host: string, params: string, chars?: number): Promise<Article[]> {
  const url = `https://${host}/w/api.php?action=query&format=json&prop=extracts|info&inprop=url&explaintext=1&exlimit=20${
    chars ? `&exchars=${chars}` : ''
  }&${params}`;
  const r = await getJson<WikiQuery>(url);
  return Object.values(r.query?.pages ?? {})
    .filter((p) => p.extract)
    .map((p) => ({ title: p.title, text: p.extract!, url: p.fullurl ?? `https://${host}/wiki/${encodeURIComponent(p.title)}` }));
}

// Nearby Wikipedia articles, plus the geotagged ones as landmark "sights" for when OpenStreetMap is unavailable.
export async function wikipediaNearby(lat: number, lon: number, locality: Locality): Promise<{ articles: Article[]; landmarks: Poi[] }> {
  const geo = await getJson<WikiQuery>(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&list=geosearch&gscoord=${lat}|${lon}&gsradius=2000&gslimit=15`,
  );
  const hits = geo.query?.geosearch ?? [];
  const [nearby, own] = await Promise.all([
    // exintro: the API only returns whole-article extracts for one page at a time.
    hits.length ? extracts('en.wikipedia.org', `exintro=1&pageids=${hits.map((g) => g.pageid).join('|')}`, 1200) : Promise.resolve([]),
    extracts('en.wikipedia.org', `titles=${encodeURIComponent(locality.name)}&redirects=1`, 4000).catch(() => []),
  ]);
  const all = [...own, ...nearby];
  const landmarks = hits
    .filter((g) => g.title.toLowerCase() !== locality.name.toLowerCase())
    .map((g) => ({ name: g.title.replace(/ \(.*\)$/, ''), kind: 'landmark', walkMinutes: walkMinutes(lat, lon, g.lat, g.lon), lat: g.lat, lon: g.lon }));
  return { articles: all.filter((a, i) => all.findIndex((b) => b.title === a.title) === i), landmarks };
}

// Keeps a Wikivoyage article's intro and its See, Do, Eat and Drink sections, which hold
// the sights and named places to eat that travellers care about.
export function travelSections(text: string, maxChars = 9000) {
  const parts = text.split(/\n(?===+ [^=]+ =+)/);
  let keeping = true; // the intro
  const keep = parts.filter((part) => {
    const top = part.match(/^== ([^=]+?) ==(?!=)/); // a top-level section; deeper ones follow their parent
    if (top) keeping = /^(See|Do|Eat|Drink)\b/i.test(top[1]);
    return keeping;
  });
  return keep.join('\n').slice(0, maxChars);
}

// The neighbourhood's own Wikivoyage article, else the city's (Fort Kochi is covered under Kochi).
export async function wikivoyage(locality: Locality): Promise<Article | undefined> {
  const city = locality.area.split(',')[0]?.trim();
  for (const title of [locality.name, city].filter(Boolean) as string[]) {
    const [a] = await extracts('en.wikivoyage.org', `titles=${encodeURIComponent(title)}&redirects=1`).catch(() => [] as Article[]);
    if (a) return { ...a, text: travelSections(a.text) };
  }
  return undefined;
}

export async function gatherSources(lat: number, lon: number, locality: Locality): Promise<Sources> {
  const errors: string[] = [];
  const failed = (what: string) => (e: unknown) => {
    const err = e instanceof AggregateError ? e.errors[0] : e;
    errors.push(`${what}: ${err instanceof Error ? err.message : String(err)}`);
  };
  const [wiki, voyage, sights, food] = await Promise.all([
    wikipediaNearby(lat, lon, locality).catch((e) => (failed('wikipedia')(e), { articles: [] as Article[], landmarks: [] as Poi[] })),
    wikivoyage(locality),
    nearbySights(lat, lon).catch((e) => (failed('overpass sights')(e), [] as Poi[])),
    nearbyFood(lat, lon).catch((e) => (failed('overpass food')(e), [] as Poi[])),
  ]);
  const photos = await wikiPhotos([locality.name, ...wiki.articles.map((a) => a.title)]).catch(
    (e) => (failed('photos')(e), {} as Record<string, Photo>),
  );
  return {
    locality,
    photos,
    wikipedia: wiki.articles,
    wikivoyage: voyage,
    sights: sights.length ? sights : wiki.landmarks,
    food,
    errors,
  };
}
