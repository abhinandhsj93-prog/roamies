// Uploads the hand-written seed guides in seed/written/*.json to Firestore.
// Each file is { "query": "Munnar, Idukki", "draft": { ...same shape the AI returns... } }.
// The query is looked up with Nominatim, then reverse-geocoded exactly as the app's API does,
// so the guide is stored under the locality a visitor there will be matched to.
// When seed/sources/<region>/<query>.json exists (from fetch-sources.ts), its location, photos
// and source credits are used instead of looking the place up again.
// Run in CI: FIREBASE_SERVICE_ACCOUNT=... node --experimental-strip-types seed/upload.ts

import { existsSync, readdirSync, readFileSync } from 'node:fs';

import { PLACE_VERSION, savePlace } from '../src/firestore.ts';
import { assemblePlace, type Draft } from '../src/generate.ts';
import { reverseGeocode, slug, type Sources } from '../src/sources.ts';

const env = { FIREBASE_PROJECT_ID: 'roamies-99c10', FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT ?? '' };
const UA = 'Roamies seeding (https://github.com/abhinandhsj93-prog/roamies)';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const only = process.argv[2]; // optional file name filter

const dir = new URL('./written/', import.meta.url);
const results: string[] = [];
for (const file of readdirSync(dir).filter((f) => f.endsWith('.json') && (!only || f.includes(only))).sort()) {
  const { query, draft, region = 'kerala' } = JSON.parse(readFileSync(new URL(file, dir), 'utf8')) as {
    query: string;
    draft: Draft;
    region?: string;
  };
  const sourceFile = new URL(`../sources/${region}/${slug(query)}.json`, dir);
  try {
    if (existsSync(sourceFile)) {
      const src = JSON.parse(readFileSync(sourceFile, 'utf8')) as Sources & { lat: number; lon: number };
      const credits = [src.wikivoyage && 'Wikivoyage', src.wikipedia.length && 'Wikipedia', 'OpenStreetMap contributors'].filter(Boolean);
      const place = {
        ...assemblePlace(src, draft, src.lat, src.lon, {
          trustNames: true,
          sourcesText: `Written by Meera, your AI travel friend, from ${credits.join(', ')}. Not yet fact-checked.`,
        }),
        model: 'claude/hand-written',
      };
      await savePlace(env, src.locality.id, JSON.stringify(place), { name: place.name, model: place.model });
      results.push(`${file} -> ${src.locality.name} (${Object.keys(src.photos ?? {}).length} photos)`);
      continue;
    }
    const search = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=${encodeURIComponent(`${query}, Kerala`)}`,
      { headers: { 'User-Agent': UA } },
    );
    const [hit] = (await search.json()) as { lat: string; lon: string }[];
    await sleep(1100);
    if (!hit) throw new Error('not found');
    const lat = Number(hit.lat);
    const lon = Number(hit.lon);
    const locality = await reverseGeocode(lat, lon);
    await sleep(1100);
    if (!locality) throw new Error('no locality');
    const place = {
      ...assemblePlace({ locality, wikipedia: [], sights: [], food: [], errors: [], photos: {} }, draft, lat, lon, {
        trustNames: true,
        sourcesText: 'Written by Meera, your AI travel friend. Not yet fact-checked.',
      }),
      model: 'claude/hand-written',
    };
    await savePlace(env, locality.id, JSON.stringify(place), { name: place.name, model: place.model });
    results.push(`${file} -> ${locality.name} (${locality.id})`);
  } catch (e) {
    results.push(`${file} FAILED ${e instanceof Error ? e.message : String(e)}`);
  }
}
console.log(`version ${PLACE_VERSION}\n${results.join('\n')}`);
console.log(`::notice title=Seed upload::${results.join(' ; ').replace(/:/g, '')}`);
