// Turns the open-data sources for a place into a Place document (same shape as src/content/types.ts
// in the app) with one AI call. The model only writes the words; ids, colours, coordinates,
// map links and sources are filled in here so they are always valid.

import type { Article, Poi, Sources } from './sources.ts';

export type Env = {
  AI_PROVIDER: 'anthropic' | 'gemini';
  AI_MODEL: string;
  AI_API_KEY: string;
};

// Illustrations that exist in the app (src/illustrations/illustrations.ts).
const SPOT_ART = ['palace', 'synagogue', 'warehouses'] as const; // heritage building, place of worship, market street
const STORY_ART = ['flood', 'pepper', 'palace', 'synagogue', 'warehouses'] as const;
const FOOD_ART = ['biryani', 'leafMeal', 'seafood'] as const;
const CARD_COLORS = ['#E4F0EC', '#FBEBD3', '#F3E4DC', '#E2EEF3', '#E6F0DA'];
const STORY_BACKGROUNDS = ['#DCEBEE', '#F3E4DC', '#FBEBD3', '#E4F0EC', '#F3E4DC'];
const FOOD_TAGS = ['vegetarian', 'mild', 'cheap', 'seafood'] as const;

type Status = { text: string; tone: 'open' | 'warning' | 'neutral' };

// What the model returns.
export type Draft = {
  briefing: string;
  hungryLine: string;
  moodReplies: { 'show-me-around': string; 'somewhere-to-chill': string; 'surprise-me': string };
  seeFirst: { caption: string; spots: { name: string; detail: string; status: Status; illustration: string }[] };
  legends: { where: string; title: string; body: string }[];
  tips: { icon: 'sun' | 'tag'; title: string; body: string }[];
  story: { era: string; title: string; body: string; illustration: string }[];
  food: { name: string; detail: string; status: Status; tags: string[]; illustration: string }[];
};

const status = {
  type: 'object',
  properties: { text: { type: 'string' }, tone: { type: 'string', enum: ['open', 'warning', 'neutral'] } },
  required: ['text', 'tone'],
};

export const DRAFT_SCHEMA = {
  type: 'object',
  properties: {
    briefing: { type: 'string' },
    hungryLine: { type: 'string' },
    moodReplies: {
      type: 'object',
      properties: {
        'show-me-around': { type: 'string' },
        'somewhere-to-chill': { type: 'string' },
        'surprise-me': { type: 'string' },
      },
      required: ['show-me-around', 'somewhere-to-chill', 'surprise-me'],
    },
    seeFirst: {
      type: 'object',
      properties: {
        caption: { type: 'string' },
        spots: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              detail: { type: 'string' },
              status,
              illustration: { type: 'string', enum: [...SPOT_ART] },
            },
            required: ['name', 'detail', 'status', 'illustration'],
          },
        },
      },
      required: ['caption', 'spots'],
    },
    legends: {
      type: 'array',
      items: {
        type: 'object',
        properties: { where: { type: 'string' }, title: { type: 'string' }, body: { type: 'string' } },
        required: ['where', 'title', 'body'],
      },
    },
    tips: {
      type: 'array',
      items: {
        type: 'object',
        properties: { icon: { type: 'string', enum: ['sun', 'tag'] }, title: { type: 'string' }, body: { type: 'string' } },
        required: ['icon', 'title', 'body'],
      },
    },
    story: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          era: { type: 'string' },
          title: { type: 'string' },
          body: { type: 'string' },
          illustration: { type: 'string', enum: [...STORY_ART] },
        },
        required: ['era', 'title', 'body', 'illustration'],
      },
    },
    food: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          detail: { type: 'string' },
          status,
          tags: { type: 'array', items: { type: 'string', enum: [...FOOD_TAGS] } },
          illustration: { type: 'string', enum: [...FOOD_ART] },
        },
        required: ['name', 'detail', 'status', 'tags', 'illustration'],
      },
    },
  },
  required: ['briefing', 'hungryLine', 'moodReplies', 'seeFirst', 'legends', 'tips', 'story', 'food'],
};

const poiLine = (p: Poi) =>
  `- ${p.name} (${p.kind}${p.cuisine ? `, ${p.cuisine}` : ''}${p.diet ? ', vegetarian' : ''}), ${p.walkMinutes} min walk${
    p.openingHours ? `, hours: ${p.openingHours}` : ''
  }`;

const articleBlock = (label: string, a: Article) => `### ${label}: ${a.title}\n${a.text}`;

export function buildPrompt(s: Sources) {
  const { locality } = s;
  return `You are Meera, a warm local friend who shows travellers around. You are clearly an AI travel friend. The user just opened the app in ${locality.name}, ${locality.area}.

Write the guide for this place using ONLY the sources below. Never invent places, dates, names or facts. If the sources are thin, write less rather than guess. Talk about the place first, not about yourself. Sound like a friend, never a textbook. Plain English, short sentences.

Rules for each field:
- briefing: 2 or 3 sentences that open with "Hey, you're in ${locality.name}!" and give one surprising true fact.
- hungryLine: one sentence about what people eat around here.
- moodReplies: one or two sentences each for "Show me around", "Somewhere to chill", "Surprise me".
- seeFirst.spots: up to 3 sights from the nearby sights list (or named in the Wikivoyage See section), nearest and most interesting first. Use the exact name. detail is "<N> min walk · <short tip>". status is from the opening hours if given (e.g. "Open till 5 pm", tone "open"; "Closed Fridays", tone "warning"), else a short practical note with tone "neutral". Pick the illustration closest in kind: palace = heritage building or fort or museum, synagogue = place of worship, warehouses = market, street or anything else.
- seeFirst.caption: e.g. "All within 6 min".
- legends: up to 2 local stories or curiosities found in the sources. "where" is a short location.
- tips: exactly 2 practical tips. icon "sun" for time-of-day or weather, "tag" for money or shopping.
- story: exactly 5 slides telling the history of this place in order, each body 2 or 3 sentences, the era a year or period. The last slide is "Today" and invites the user to go explore. Pick the closest illustration: flood = water, rivers, nature or origins; pepper = trade, spices, arrivals; palace, synagogue, warehouses as above.
- food: up to 5 places to eat from the nearby food list, or named in the Wikivoyage Eat section if that list is empty, using exact names. Prefer places close to this neighbourhood. detail is "<dish or cuisine> · <₹, ₹₹ or ₹₹₹ if you can tell, else leave out> · <N> min". Tags only when the source supports them.

## Nearby sights
${s.sights.map(poiLine).join('\n') || '(none found)'}

## Nearby food (OpenStreetMap)
${s.food.map(poiLine).join('\n') || '(none found)'}

## Articles
${[...(s.wikivoyage ? [articleBlock('Wikivoyage', s.wikivoyage)] : []), ...s.wikipedia.map((a) => articleBlock('Wikipedia', a))].join('\n\n') || '(none found)'}`;
}

async function callAnthropic(env: Env, prompt: string): Promise<Draft> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': env.AI_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: env.AI_MODEL,
      max_tokens: 4000,
      tools: [{ name: 'save_guide', description: 'Save the place guide.', input_schema: DRAFT_SCHEMA }],
      tool_choice: { type: 'tool', name: 'save_guide' },
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as { content: { type: string; input?: unknown }[] };
  const tool = body.content.find((c) => c.type === 'tool_use');
  if (!tool?.input) throw new Error('anthropic: no tool output');
  return tool.input as Draft;
}

async function callGemini(env: Env, prompt: string): Promise<Draft> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${env.AI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': env.AI_API_KEY },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', responseJsonSchema: DRAFT_SCHEMA },
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('gemini: empty response');
  return JSON.parse(text) as Draft;
}

const pick = <T extends string>(value: string, allowed: readonly T[]): T =>
  (allowed as readonly string[]).includes(value) ? (value as T) : allowed[0];
const nonEmpty = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0;
const tone = (t: string): Status['tone'] => pick(t, ['neutral', 'open', 'warning'] as const);

// Checks the draft and assembles the Place document. Throws when the draft is unusable.
export function assemblePlace(s: Sources, d: Draft, lat: number, lon: number) {
  if (!nonEmpty(d.briefing) || !Array.isArray(d.story) || d.story.length < 3) throw new Error('draft missing briefing or story');
  const { locality } = s;
  const near = (list: Poi[], name: string) => list.find((p) => p.name.toLowerCase() === name.toLowerCase());
  const mapsQuery = (name: string) => `${name}, ${locality.name}, ${locality.area}`;

  // Only keep places named in the sources (OSM lists or the Wikivoyage text), so every card is real.
  const voyageText = s.wikivoyage?.text.toLowerCase() ?? '';
  const inSources = (list: Poi[], name: string) => Boolean(near(list, name)) || voyageText.includes(name.toLowerCase());
  const spots = (d.seeFirst?.spots ?? []).filter((x) => nonEmpty(x.name) && inSources(s.sights, x.name)).slice(0, 3);
  const food = (d.food ?? []).filter((x) => nonEmpty(x.name) && inSources(s.food, x.name)).slice(0, 5);

  const credits = ['OpenStreetMap contributors'];
  if (s.wikipedia.length) credits.unshift('Wikipedia');
  if (s.wikivoyage) credits.unshift('Wikivoyage');

  return {
    id: locality.id,
    lang: 'en' as const,
    persona: 'meera' as const,
    name: locality.name,
    area: locality.area,
    coords: { latitude: lat, longitude: lon },
    hero: 'mattancherrySunset',
    briefing: d.briefing,
    hungryLine: nonEmpty(d.hungryLine) ? d.hungryLine : "Here's what's good to eat nearby.",
    moodReplies: d.moodReplies,
    seeFirst: {
      caption: d.seeFirst?.caption ?? '',
      spots: spots.map((x, i) => ({
        id: `spot-${i}`,
        name: x.name,
        detail: x.detail,
        status: { text: x.status?.text ?? '', tone: tone(x.status?.tone) },
        mapsQuery: mapsQuery(x.name),
        illustration: pick(x.illustration, SPOT_ART),
        cardColor: CARD_COLORS[i % CARD_COLORS.length],
      })),
    },
    legends: (d.legends ?? []).slice(0, 2).map((x, i) => ({ id: `legend-${i}`, ...x })),
    tips: (d.tips ?? []).slice(0, 2).map((x, i) => ({ id: `tip-${i}`, ...x, icon: pick(x.icon, ['sun', 'tag'] as const) })),
    story: d.story.slice(0, 5).map((x, i) => ({
      id: `slide-${i}`,
      era: x.era,
      title: x.title,
      body: x.body,
      illustration: pick(x.illustration, STORY_ART),
      background: STORY_BACKGROUNDS[i % STORY_BACKGROUNDS.length],
    })),
    food: food.map((x, i) => ({
      id: `food-${i}`,
      name: x.name,
      detail: x.detail,
      status: { text: x.status?.text ?? '', tone: tone(x.status?.tone) },
      mapsQuery: mapsQuery(x.name),
      illustration: pick(x.illustration, FOOD_ART),
      iconColor: CARD_COLORS[(i + 1) % CARD_COLORS.length],
      tags: (x.tags ?? []).filter((t) => (FOOD_TAGS as readonly string[]).includes(t)),
    })),
    sources: `AI-written by Meera from ${credits.join(', ')}.`,
    sourceLinks: [...(s.wikivoyage ? [s.wikivoyage.url] : []), ...s.wikipedia.map((a) => a.url)],
    factChecked: false,
    aiGenerated: true,
    model: '',
    generatedAt: new Date().toISOString(),
  };
}

export type GeneratedPlace = ReturnType<typeof assemblePlace>;

// Model overloads (429, 500, 503) are usually brief, so retry a couple of times before giving up.
async function withRetry<T>(fn: () => Promise<T>, waits = [2000, 6000]): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      const transient = e instanceof Error && /\b(429|500|503)\b/.test(e.message);
      if (!transient || attempt >= waits.length) throw e;
      await new Promise((r) => setTimeout(r, waits[attempt]));
    }
  }
}

export async function generatePlace(env: Env, s: Sources, lat: number, lon: number): Promise<GeneratedPlace> {
  const prompt = buildPrompt(s);
  const draft = await withRetry(() => (env.AI_PROVIDER === 'gemini' ? callGemini(env, prompt) : callAnthropic(env, prompt)));
  return { ...assemblePlace(s, draft, lat, lon), model: `${env.AI_PROVIDER}/${env.AI_MODEL}` };
}
