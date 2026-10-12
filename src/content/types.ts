import type { IllustrationId } from '@/illustrations/illustrations';

// Content shape for one neighbourhood. Mirrors what the Here, Story and I'm hungry
// screens show; later this is what gets stored in Firestore (one document per place + lang).

export type Lang = 'en';

export type Status = { text: string; tone: 'open' | 'warning' | 'neutral' };

export type Spot = {
  id: string;
  name: string;
  detail: string; // "3 min walk · Shoes off inside"
  status: Status;
  // Free-text Google Maps destination for the walking-directions deep link.
  mapsQuery: string;
  illustration: IllustrationId;
  cardColor: string;
};

export type FoodTag = 'vegetarian' | 'mild' | 'cheap' | 'seafood';

export type FoodSpot = Omit<Spot, 'cardColor'> & {
  tags: FoodTag[];
  iconColor: string;
};

export type Legend = { id: string; where: string; title: string; body: string };

export type Tip = { id: string; icon: 'sun' | 'tag'; title: string; body: string };

export type StorySlide = {
  id: string;
  era: string;
  title: string;
  body: string;
  illustration: IllustrationId;
  background: string;
};

export type Mood = 'show-me-around' | 'somewhere-to-chill' | 'surprise-me';

export type Place = {
  id: string;
  lang: Lang;
  persona: 'meera';
  name: string;
  area: string; // "Kochi, Kerala"
  coords: { latitude: number; longitude: number };
  hero: IllustrationId;
  briefing: string;
  hungryLine: string;
  moodReplies: Record<Mood, string>;
  seeFirst: { spots: Spot[]; caption: string };
  legends: Legend[];
  tips: Tip[];
  story: StorySlide[];
  food: FoodSpot[];
  sources: string;
  // false until a person has fact-checked the copy (README: content accuracy rule).
  factChecked: boolean;
  // true when the Roamies API wrote it live from open data (shown as AI-written).
  aiGenerated?: boolean;
};
