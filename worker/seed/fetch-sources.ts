// Fetches the open data behind each seed place (Wikipedia, Wikivoyage, OpenStreetMap and
// Wikimedia photos) and saves it to seed/sources/<name>.json, so guides can be written and
// checked against real sources. Runs in CI, which can reach those sites.
// Usage: REGION=kerala node --experimental-strip-types seed/fetch-sources.ts [filter]
// Each region has a place list at seed/<region>.txt; the first line is "# state: <State name>".

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

import { gatherSources, reverseGeocode, slug, wikipediaArticle } from '../src/sources.ts';
import { wikiPhotos } from '../src/photos.ts';

const UA = 'Roamies seeding (https://github.com/abhinandhsj93-prog/roamies)';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const filter = process.argv[2];
const here = new URL('./', import.meta.url);
const region = process.env.REGION || 'kerala';
const list = readFileSync(new URL(`${region}.txt`, here), 'utf8');
const state = list.match(/^# state: (.+)$/m)?.[1].trim() ?? region;

// Every query in the region's list, plus (for Kerala) the queries of the hand-written guides.
const queries = new Set<string>();
for (const line of list.split('\n')) {
  if (line.trim() && !line.startsWith('#')) queries.add(line.trim());
}
if (region === 'kerala') {
  for (const f of readdirSync(new URL('written/', here)).filter((f) => f.endsWith('.json'))) {
    const w = JSON.parse(readFileSync(new URL(`written/${f}`, here), 'utf8'));
    if ((w.region ?? 'kerala') === 'kerala') queries.add(w.query);
  }
}

const outDir = new URL(`sources/${region}/`, here);
mkdirSync(outDir, { recursive: true });
const report: string[] = [];
for (const query of [...queries].filter((q) => !filter || q.toLowerCase().includes(filter.toLowerCase()))) {
  // "Name @ lat,lon" pins a place whose name Nominatim resolves badly.
  const pin = query.match(/^(.+?)\s*@\s*(-?[\d.]+),\s*(-?[\d.]+)$/);
  const name = pin ? pin[1] : query;
  const file = new URL(`${slug(name)}.json`, outDir);
  if (existsSync(file) && !process.env.REFRESH) continue;
  try {
    const hit = pin
      ? { lat: pin[2], lon: pin[3], display_name: `${pin[1]} (pinned)` }
      : await search(query);
    if (!hit) throw new Error('not found by Nominatim');
    const lat = Number(hit.lat);
    const lon = Number(hit.lon);
    const locality = await reverseGeocode(lat, lon);
    await sleep(1100);
    if (!locality) throw new Error('no locality');
    if (locality.state && locality.state !== state) throw new Error(`resolved to ${locality.name}, ${locality.state}`);
    const s = await gatherSources(lat, lon, locality);
    // The place's own article ("Jog Falls"), which a search around the point can miss.
    const own = await wikipediaArticle(name.split(',')[0].trim()).catch(() => undefined);
    if (own && !s.wikipedia.some((a) => a.title === own.title)) {
      s.wikipedia.unshift(own);
      Object.assign(s.photos, await wikiPhotos([own.title]).catch(() => ({})));
    }
    writeFileSync(file, JSON.stringify({ query: name, found: hit.display_name, lat, lon, fetchedAt: new Date().toISOString(), ...s }, null, 1));
    report.push(`${name} -> ${locality.name}: ${s.wikipedia.length} wiki, ${s.wikivoyage ? 'voyage' : 'no voyage'}, ${s.sights.length} sights, ${s.food.length} food, ${Object.keys(s.photos).length} photos${s.errors.length ? `, errors ${s.errors.join('/')}` : ''}`);
    await sleep(2000);
  } catch (e) {
    report.push(`${query} FAILED ${e instanceof Error ? e.message : String(e)}`);
  }
}
console.log(report.join('\n'));
writeFileSync(new URL('fetch-report.txt', outDir), report.join('\n') + '\n');

async function search(query: string) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=${encodeURIComponent(`${query}, ${state}`)}`,
    { headers: { 'User-Agent': UA } },
  );
  const [hit] = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  await sleep(1100);
  return hit;
}
