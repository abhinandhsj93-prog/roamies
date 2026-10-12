// Open data for one location: the locality name (Nominatim), nearby Wikipedia articles,
// the Wikivoyage article if there is one, and named sights and food spots from OpenStreetMap.

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
};

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'User-Agent': USER_AGENT, ...(init?.headers ?? {}) } });
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
    a.neighbourhood ?? a.suburb ?? a.quarter ?? a.village ?? a.town ?? a.city_district ?? a.city ?? a.county;
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

type OverpassElement = { lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };

export async function nearbyPois(lat: number, lon: number): Promise<{ sights: Poi[]; food: Poi[] }> {
  const query = `[out:json][timeout:25];
(
  nwr(around:1200,${lat},${lon})[name][tourism~"^(attraction|museum|viewpoint|gallery)$"];
  nwr(around:1200,${lat},${lon})[name][historic];
  nwr(around:1200,${lat},${lon})[name][amenity=place_of_worship];
  nwr(around:1200,${lat},${lon})[name][leisure~"^(park|beach_resort)$"];
  nwr(around:900,${lat},${lon})[name][amenity~"^(restaurant|cafe|fast_food)$"];
);
out center tags 120;`;
  const r = await getJson<{ elements: OverpassElement[] }>('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: new URLSearchParams({ data: query }),
  });
  const sights: Poi[] = [];
  const food: Poi[] = [];
  const seen = new Set<string>();
  for (const e of r.elements) {
    const t = e.tags ?? {};
    const pLat = e.lat ?? e.center?.lat;
    const pLon = e.lon ?? e.center?.lon;
    if (!t.name || pLat === undefined || pLon === undefined || seen.has(t.name)) continue;
    seen.add(t.name);
    const isFood = /^(restaurant|cafe|fast_food)$/.test(t.amenity ?? '');
    const poi: Poi = {
      name: t['name:en'] ?? t.name,
      kind: t.tourism ?? t.historic ?? t.amenity ?? t.leisure ?? 'place',
      cuisine: t.cuisine,
      openingHours: t.opening_hours,
      diet: /^(yes|only)$/.test(t['diet:vegetarian'] ?? '') ? 'vegetarian' : undefined,
      walkMinutes: walkMinutes(lat, lon, pLat, pLon),
      lat: pLat,
      lon: pLon,
    };
    (isFood ? food : sights).push(poi);
  }
  const byDistance = (a: Poi, b: Poi) => a.walkMinutes - b.walkMinutes;
  return { sights: sights.sort(byDistance).slice(0, 15), food: food.sort(byDistance).slice(0, 15) };
}

type WikiQuery = { query?: { geosearch?: { pageid: number; title: string }[]; pages?: Record<string, { title: string; extract?: string; fullurl?: string }> } };

async function extracts(host: string, params: string, chars: number): Promise<Article[]> {
  const url = `https://${host}/w/api.php?action=query&format=json&prop=extracts|info&inprop=url&explaintext=1&exlimit=20&exchars=${chars}&${params}`;
  const r = await getJson<WikiQuery>(url);
  return Object.values(r.query?.pages ?? {})
    .filter((p) => p.extract)
    .map((p) => ({ title: p.title, text: p.extract!, url: p.fullurl ?? `https://${host}/wiki/${encodeURIComponent(p.title)}` }));
}

export async function wikipediaNearby(lat: number, lon: number, locality: Locality): Promise<Article[]> {
  const geo = await getJson<WikiQuery>(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&list=geosearch&gscoord=${lat}|${lon}&gsradius=2000&gslimit=12`,
  );
  const ids = (geo.query?.geosearch ?? []).map((g) => g.pageid);
  const [nearby, own] = await Promise.all([
    ids.length ? extracts('en.wikipedia.org', `pageids=${ids.join('|')}`, 1200) : Promise.resolve([]),
    extracts('en.wikipedia.org', `titles=${encodeURIComponent(locality.name)}&redirects=1`, 4000).catch(() => []),
  ]);
  const all = [...own, ...nearby];
  return all.filter((a, i) => all.findIndex((b) => b.title === a.title) === i);
}

export async function wikivoyage(locality: Locality): Promise<Article | undefined> {
  const [a] = await extracts('en.wikivoyage.org', `titles=${encodeURIComponent(locality.name)}&redirects=1`, 6000).catch(
    () => [] as Article[],
  );
  return a;
}

export async function gatherSources(lat: number, lon: number, locality: Locality): Promise<Sources> {
  const [wiki, voyage, pois] = await Promise.all([
    wikipediaNearby(lat, lon, locality).catch(() => [] as Article[]),
    wikivoyage(locality),
    nearbyPois(lat, lon).catch(() => ({ sights: [], food: [] })),
  ]);
  return { locality, wikipedia: wiki, wikivoyage: voyage, ...pois };
}
