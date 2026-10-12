// Roamies API (Cloudflare Worker).
//
// GET /place?lat=9.95&lng=76.26
//   200 { status: "ready", place }       guide for the user's locality (cached in Firestore)
//   202 { status: "generating", name }   someone else is generating it right now; ask again shortly
//   404 { status: "unknown" }            no locality or no open data for this spot
//
// The first request for a locality gathers open data, has the AI write the guide once,
// stores it, and returns it. Every later request is served from Firestore.

import { getPlaceJson, releaseLock, savePlace, takeLock, type FirestoreEnv } from './firestore.ts';
import { generatePlace, type Env as AiEnv } from './generate.ts';
import { gatherSources, reverseGeocode } from './sources.ts';

type Env = AiEnv & FirestoreEnv;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
  });

const ready = (placeJson: string) =>
  new Response(`{"status":"ready","place":${placeJson}}`, {
    headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
  });

async function handlePlace(env: Env, lat: number, lng: number) {
  const locality = await reverseGeocode(lat, lng);
  if (!locality) return json({ status: 'unknown' }, 404);

  const cached = await getPlaceJson(env, locality.id);
  if (cached) return ready(cached);

  if (!(await takeLock(env, locality.id))) return json({ status: 'generating', name: locality.name }, 202);
  try {
    // Another request may have finished between our read and taking the lock.
    const again = await getPlaceJson(env, locality.id);
    if (again) return ready(again);

    const sources = await gatherSources(lat, lng, locality);
    if (!sources.wikipedia.length && !sources.wikivoyage && !sources.sights.length) {
      return json({ status: 'unknown', name: locality.name }, 404);
    }
    const place = await generatePlace(env, sources, lat, lng);
    const placeJson = JSON.stringify(place);
    await savePlace(env, locality.id, placeJson, { name: place.name, model: place.model });
    return ready(placeJson);
  } finally {
    await releaseLock(env, locality.id);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return json({});
    if (url.pathname !== '/place' || request.method !== 'GET') return json({ error: 'not found' }, 404);

    const lat = Number(url.searchParams.get('lat'));
    const lng = Number(url.searchParams.get('lng'));
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return json({ error: 'lat and lng are required' }, 400);
    }
    try {
      return await handlePlace(env, lat, lng);
    } catch (e) {
      console.error(e);
      return json({ status: 'error', error: e instanceof Error ? e.message : String(e) }, 500);
    }
  },
};
