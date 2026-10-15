// Minimal Firestore REST client for the worker, signed in as a Firebase service account.
// Places are stored as a JSON string so we don't have to map every field to Firestore types.

export type FirestoreEnv = { FIREBASE_PROJECT_ID: string; FIREBASE_SERVICE_ACCOUNT: string };

type ServiceAccount = { client_email: string; private_key: string };

let cachedToken: { token: string; expires: number } | undefined;

const b64url = (data: ArrayBuffer | string) => {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

async function accessToken(env: FirestoreEnv): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expires > now + 60) return cachedToken.token;
  const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT) as ServiceAccount;
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  );
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${claims}`));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claims}.${b64url(signature)}`,
    }),
  });
  if (!res.ok) throw new Error(`google token ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: body.access_token, expires: now + body.expires_in };
  return body.access_token;
}

const docUrl = (env: FirestoreEnv, path: string) =>
  `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}`;

type Fields = Record<
  string,
  { stringValue?: string; timestampValue?: string; booleanValue?: boolean; integerValue?: string; doubleValue?: number }
>;

// Bump when the guide format or sources change; older stored guides are then written again on next visit.
export const PLACE_VERSION = 2;

async function request(env: FirestoreEnv, url: string, init: RequestInit = {}) {
  return fetch(url, {
    ...init,
    headers: { authorization: `Bearer ${await accessToken(env)}`, 'content-type': 'application/json' },
  });
}

/** Returns the stored place JSON, or null when it doesn't exist yet. */
export async function getPlaceJson(env: FirestoreEnv, id: string): Promise<string | null> {
  const res = await request(env, docUrl(env, `places/${id}_en`));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`firestore get ${res.status}`);
  const doc = (await res.json()) as { fields?: Fields };
  if (Number(doc.fields?.version?.integerValue ?? 1) < PLACE_VERSION) return null;
  return doc.fields?.json?.stringValue ?? null;
}

export async function savePlace(
  env: FirestoreEnv,
  id: string,
  json: string,
  meta: { name: string; model: string; lat?: number; lon?: number; seeded?: boolean },
) {
  const fields: Fields = {
    ...(meta.lat !== undefined && meta.lon !== undefined ? { lat: { doubleValue: meta.lat }, lon: { doubleValue: meta.lon } } : {}),
    ...(meta.seeded ? { seeded: { booleanValue: true } } : {}),
    json: { stringValue: json },
    name: { stringValue: meta.name },
    lang: { stringValue: 'en' },
    version: { integerValue: String(PLACE_VERSION) },
    model: { stringValue: meta.model },
    factChecked: { booleanValue: false },
    generatedAt: { timestampValue: new Date().toISOString() },
  };
  const res = await request(env, docUrl(env, `places/${id}_en`), { method: 'PATCH', body: JSON.stringify({ fields }) });
  if (!res.ok) throw new Error(`firestore save ${res.status}: ${await res.text()}`);
}

const km = (lat1: number, lon1: number, lat2: number, lon2: number) =>
  Math.hypot((lon2 - lon1) * Math.cos((lat1 * Math.PI) / 180), lat2 - lat1) * 111.32;

/**
 * The nearest pre-written (seeded) guide within radiusKm, as JSON. Seeded guides cover a whole
 * town or sight, so a visitor anywhere around it gets that guide instead of waiting for a new one.
 */
export async function nearestSeededJson(env: FirestoreEnv, lat: number, lon: number, radiusKm: number): Promise<string | null> {
  const dLat = radiusKm / 111.32;
  const range = (op: string, value: number) => ({ fieldFilter: { field: { fieldPath: 'lat' }, op, value: { doubleValue: value } } });
  const res = await request(env, docUrl(env, '').replace(/\/$/, '') + ':runQuery', {
    method: 'POST',
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'places' }],
        where: { compositeFilter: { op: 'AND', filters: [range('GREATER_THAN_OR_EQUAL', lat - dLat), range('LESS_THAN_OR_EQUAL', lat + dLat)] } },
        limit: 200,
      },
    }),
  });
  if (!res.ok) throw new Error(`firestore query ${res.status}`);
  const rows = (await res.json()) as { document?: { fields?: Fields } }[];
  let best: { d: number; json: string } | undefined;
  for (const { document } of rows) {
    const f = document?.fields;
    if (!f?.seeded?.booleanValue || f.lon?.doubleValue === undefined || f.lat?.doubleValue === undefined) continue;
    if (Number(f.version?.integerValue ?? 1) < PLACE_VERSION || !f.json?.stringValue) continue;
    const d = km(lat, lon, f.lat.doubleValue, f.lon.doubleValue);
    if (d <= radiusKm && (!best || d < best.d)) best = { d, json: f.json.stringValue };
  }
  return best?.json ?? null;
}

export type IndexEntry = { id: string; name: string; area: string; lat: number; lon: number };

/** Every pre-written guide's name and location, for the app's place search. */
export async function seededIndex(env: FirestoreEnv): Promise<IndexEntry[]> {
  const res = await request(env, docUrl(env, '').replace(/\/$/, '') + ':runQuery', {
    method: 'POST',
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'places' }],
        where: { fieldFilter: { field: { fieldPath: 'seeded' }, op: 'EQUAL', value: { booleanValue: true } } },
        select: { fields: [{ fieldPath: 'name' }, { fieldPath: 'lat' }, { fieldPath: 'lon' }, { fieldPath: 'json' }] },
        limit: 5000,
      },
    }),
  });
  if (!res.ok) throw new Error(`firestore index ${res.status}`);
  const rows = (await res.json()) as { document?: { name: string; fields?: Fields } }[];
  return rows.flatMap(({ document: d }) => {
    const f = d?.fields;
    if (!f?.lat?.doubleValue || !f.lon?.doubleValue || !f.name?.stringValue) return [];
    const area = (JSON.parse(f.json?.stringValue ?? '{}') as { area?: string }).area ?? '';
    return [{ id: d!.name.split('/').pop()!.replace(/_en$/, ''), name: f.name.stringValue, area, lat: f.lat.doubleValue, lon: f.lon.doubleValue }];
  });
}

const LOCK_SECONDS = 120;

/**
 * Generation lock: only one request generates a place. Creating the lock document fails
 * when it already exists, unless the old lock is stale (a crashed run).
 */
export async function takeLock(env: FirestoreEnv, id: string): Promise<boolean> {
  const fields: Fields = { lockedAt: { timestampValue: new Date().toISOString() } };
  const create = await request(env, docUrl(env, `locks?documentId=${id}_en`), {
    method: 'POST',
    body: JSON.stringify({ fields }),
  });
  if (create.ok) return true;
  if (create.status !== 409) throw new Error(`firestore lock ${create.status}`);
  const existing = await request(env, docUrl(env, `locks/${id}_en`));
  if (!existing.ok) return false;
  const doc = (await existing.json()) as { fields?: Fields; updateTime?: string };
  const lockedAt = Date.parse(doc.fields?.lockedAt?.timestampValue ?? '');
  if (Date.now() - lockedAt < LOCK_SECONDS * 1000) return false;
  // Stale: take it over, but only if nobody else did since we read it.
  const takeover = await request(
    env,
    `${docUrl(env, `locks/${id}_en`)}?currentDocument.updateTime=${encodeURIComponent(doc.updateTime ?? '')}`,
    { method: 'PATCH', body: JSON.stringify({ fields }) },
  );
  return takeover.ok;
}

export async function releaseLock(env: FirestoreEnv, id: string) {
  await request(env, docUrl(env, `locks/${id}_en`), { method: 'DELETE' }).catch(() => undefined);
}
