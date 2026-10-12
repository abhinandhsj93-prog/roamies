// End-to-end test of GET /place with every outside service stubbed.
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { test } from 'node:test';

import worker from '../src/index.ts';

const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const env = {
  AI_PROVIDER: 'gemini' as const,
  AI_MODEL: 'gemini-3.8-flash',
  AI_API_KEY: 'test-key',
  FIREBASE_PROJECT_ID: 'roamies-test',
  FIREBASE_SERVICE_ACCOUNT: JSON.stringify({
    client_email: 'worker@roamies-test.iam.gserviceaccount.com',
    private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }),
  }),
};

const draft = {
  briefing: "Hey, you're in Mattancherry! The Dutch Palace was built by the Portuguese.",
  hungryLine: 'People come for Kochi biryani.',
  moodReplies: { 'show-me-around': 'Walk to the palace.', 'somewhere-to-chill': 'Sit by the water.', 'surprise-me': 'Look up.' },
  seeFirst: {
    caption: 'All within 6 min',
    spots: [
      { name: 'Mattancherry Palace', detail: '6 min walk · Murals', status: { text: 'Closed Fridays', tone: 'warning' }, illustration: 'palace' },
      { name: 'Made Up Fort', detail: '1 min walk', status: { text: 'Open', tone: 'open' }, illustration: 'palace' },
    ],
  },
  legends: [{ where: 'Synagogue', title: 'Tiles', body: 'No two alike.' }],
  tips: [{ icon: 'sun', title: 'Go early.', body: 'Cooler.' }, { icon: 'bogus', title: 'Bargain.', body: 'Half price.' }],
  story: [1, 2, 3, 4, 5].map((n) => ({ era: `${n}`, title: `Part ${n}`, body: 'Body.', illustration: n === 2 ? 'pepper' : 'not-real' })),
  food: [{ name: 'Kayees Biryani', detail: 'Biryani · ₹₹ · 4 min', status: { text: 'Open', tone: 'open' }, tags: ['cheap', 'spicy'], illustration: 'biryani' }],
};

function stubFetch(store: Map<string, string>, calls: string[]) {
  return async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    const method = init?.method ?? 'GET';
    calls.push(`${method} ${new URL(url).host}`);
    const ok = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
    if (url.includes('nominatim')) {
      return ok({ address: { suburb: 'Mattancherry', city: 'Kochi', state_district: 'Ernakulam', state: 'Kerala', country: 'India' } });
    }
    if (url.includes('overpass')) {
      return ok({
        elements: [
          { lat: 9.958, lon: 76.259, tags: { name: 'Mattancherry Palace', tourism: 'museum', opening_hours: 'Sa-Th 10:00-17:00' } },
          { lat: 9.957, lon: 76.26, tags: { name: 'Kayees Biryani', amenity: 'restaurant', cuisine: 'indian' } },
        ],
      });
    }
    if (url.includes('wikipedia.org') && url.includes('geosearch')) return ok({ query: { geosearch: [{ pageid: 1, title: 'Mattancherry Palace' }] } });
    if (url.includes('wikipedia.org')) return ok({ query: { pages: { 1: { title: 'Mattancherry', extract: 'A locality in Kochi.', fullurl: 'https://en.wikipedia.org/wiki/Mattancherry' } } } });
    if (url.includes('wikivoyage')) return ok({ query: { pages: { '-1': { title: 'Mattancherry' } } } });
    if (url.includes('generativelanguage')) {
      assert.equal((init?.headers as Record<string, string>)['x-goog-api-key'], 'test-key');
      return ok({ candidates: [{ content: { parts: [{ text: JSON.stringify(draft) }] } }] });
    }
    if (url.includes('oauth2.googleapis.com')) return ok({ access_token: 'token', expires_in: 3600 });
    if (url.includes('firestore')) {
      const path = new URL(url).pathname.split('/documents/')[1];
      const docId = path.startsWith('locks') && method === 'POST' ? `locks/${new URL(url).searchParams.get('documentId')}` : path;
      if (method === 'GET') return store.has(docId) ? new Response(store.get(docId)) : ok({}, 404);
      if (method === 'POST' && store.has(docId)) return ok({}, 409);
      if (method === 'DELETE') { store.delete(docId); return ok({}); }
      store.set(docId, String(init?.body));
      return ok({});
    }
    throw new Error(`unexpected fetch ${url}`);
  };
}

test('first request generates and stores the place, second is served from Firestore', async () => {
  const store = new Map<string, string>();
  const calls: string[] = [];
  globalThis.fetch = stubFetch(store, calls) as typeof fetch;

  const res = await worker.fetch(new Request('https://api.test/place?lat=9.9576&lng=76.2595'), env);
  assert.equal(res.status, 200);
  const { status, place } = (await res.json()) as { status: string; place: any };
  assert.equal(status, 'ready');
  assert.equal(place.id, 'mattancherry-ernakulam-kerala');
  assert.equal(place.area, 'Kochi, Kerala');
  assert.deepEqual(place.seeFirst.spots.map((s: any) => s.name), ['Mattancherry Palace'], 'invented spots are dropped');
  assert.equal(place.seeFirst.spots[0].mapsQuery, 'Mattancherry Palace, Mattancherry, Kochi, Kerala');
  assert.deepEqual(place.food[0].tags, ['cheap'], 'unknown tags are dropped');
  assert.equal(place.tips[1].icon, 'sun', 'unknown icons fall back');
  assert.equal(place.story.length, 5);
  assert.equal(place.story[0].illustration, 'flood', 'unknown illustrations fall back');
  assert.equal(place.story[1].illustration, 'pepper');
  assert.equal(place.aiGenerated, true);
  assert.equal(place.factChecked, false);
  assert.match(place.sources, /Wikipedia, OpenStreetMap contributors/);
  assert.ok(store.has('places/mattancherry-ernakulam-kerala_en'));
  assert.ok(!store.has('locks/mattancherry-ernakulam-kerala_en'), 'lock released');

  calls.length = 0;
  const again = await worker.fetch(new Request('https://api.test/place?lat=9.9576&lng=76.2595'), env);
  assert.equal(((await again.json()) as any).place.name, 'Mattancherry');
  assert.ok(!calls.some((c) => c.includes('generativelanguage')), 'no second AI call');
});

test('a held lock returns 202 generating', async () => {
  const store = new Map<string, string>([
    ['locks/mattancherry-ernakulam-kerala_en', JSON.stringify({ fields: { lockedAt: { timestampValue: new Date().toISOString() } }, updateTime: 'x' })],
  ]);
  globalThis.fetch = stubFetch(store, []) as typeof fetch;
  const res = await worker.fetch(new Request('https://api.test/place?lat=9.9576&lng=76.2595'), env);
  assert.equal(res.status, 202);
  assert.equal(((await res.json()) as any).status, 'generating');
});

test('bad coordinates are rejected', async () => {
  const res = await worker.fetch(new Request('https://api.test/place?lat=abc'), env);
  assert.equal(res.status, 400);
});

test('travelSections keeps the intro and See, Do, Eat and Drink', async () => {
  const { travelSections } = await import('../src/sources.ts');
  const text = 'Intro.\n== Understand ==\nHistory.\n== See ==\nFort.\n== Eat ==\n=== Budget ===\nKashi Art Cafe.\n== Sleep ==\nHotel.';
  assert.equal(travelSections(text), 'Intro.\n== See ==\nFort.\n== Eat ==\n=== Budget ===\nKashi Art Cafe.');
});
