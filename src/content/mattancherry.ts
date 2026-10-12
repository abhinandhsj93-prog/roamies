import { colors } from '@/theme/tokens';

import type { Place } from './types';

// Copy from design/canvas/Here.dc.html, Story.dc.html and Hungry.dc.html.
// Food spots are still the design's placeholders: fill them in during the Week 1 content pass.
export const mattancherry: Place = {
  id: 'mattancherry',
  lang: 'en',
  persona: 'meera',
  name: 'Mattancherry',
  area: 'Kochi, Kerala',
  coords: { latitude: 9.9576, longitude: 76.2595 },
  hero: 'mattancherrySunset',
  briefing:
    "Hey, you're in Mattancherry! This is where Kochi's spice trade began, and on a warm day the lanes still smell of ginger. Funny thing: the Dutch Palace down the road was built by the Portuguese.",
  hungryLine:
    "Mattancherry is famous for Kochi-style biryani, but there's something for everyone. Here's what's open near you.",
  moodReplies: {
    'show-me-around':
      'Start with the spice warehouses while the lanes are cool, then walk to the synagogue and end at the palace. All of it is within six minutes.',
    'somewhere-to-chill':
      "Find a café in Jew Town, order a lime soda and watch the antique shops open. Nobody here is in a hurry, so you shouldn't be either.",
    'surprise-me':
      'Look up at the synagogue clock tower as you pass. People say it shows Hebrew, Roman and Malayalam numerals.',
  },
  seeFirst: {
    caption: 'All within 6 min',
    spots: [
      {
        id: 'paradesi-synagogue',
        name: 'Paradesi Synagogue',
        detail: '3 min walk · Shoes off inside',
        status: { text: 'Open till 5 pm', tone: 'open' },
        mapsQuery: 'Paradesi Synagogue Kochi',
        illustration: 'synagogue',
        cardColor: colors.mint,
      },
      {
        id: 'mattancherry-palace',
        name: 'Mattancherry Palace',
        detail: '6 min walk · Ramayana murals',
        status: { text: 'Closed Fridays', tone: 'warning' },
        mapsQuery: 'Mattancherry Palace Kochi',
        illustration: 'palace',
        cardColor: colors.sand,
      },
      {
        id: 'spice-warehouses',
        name: 'Spice warehouses',
        detail: '2 min walk · Ask before going in',
        status: { text: 'Best before noon', tone: 'neutral' },
        mapsQuery: 'Jew Town Mattancherry Kochi',
        illustration: 'warehouses',
        cardColor: colors.clay,
      },
    ],
  },
  legends: [
    {
      id: 'tiles',
      where: 'In the synagogue',
      title: 'No two floor tiles are alike',
      body: "That's what people here say about the hand-painted Chinese tiles. See if you can prove them wrong.",
    },
    {
      id: 'clock',
      where: 'At the clock tower',
      title: 'A clock in three scripts',
      body: 'Hebrew, Roman and Malayalam numerals, they say. Look up as you pass.',
    },
  ],
  tips: [
    { id: 'morning', icon: 'sun', title: 'Come in the morning.', body: 'Cooler lanes, shops just opening.' },
    { id: 'bargain', icon: 'tag', title: 'Bargain on antiques.', body: 'Start at about half the price.' },
  ],
  story: [
    {
      id: 'flood',
      era: '1341',
      title: 'A flood made Kochi',
      body: 'The Periyar river flooded so hard it choked the old port up north and carved a brand-new harbour right here. Overnight, this sleepy coast became the place to land.',
      illustration: 'flood',
      background: '#DCEBEE',
    },
    {
      id: 'pepper',
      era: 'The next 400 years',
      title: 'Then the whole world came',
      body: 'Arabs, Chinese, Jews, Portuguese, Dutch, British. All for pepper. They called it black gold, and these lanes were where it changed hands.',
      illustration: 'pepper',
      background: colors.clay,
    },
    {
      id: 'palace',
      era: 'Around 1555',
      title: 'A palace with the wrong name',
      body: 'The Portuguese built it as a gift for the Raja of Kochi. A century later the Dutch repaired it, and somehow the name “Dutch Palace” stuck. Go inside for the Ramayana murals.',
      illustration: 'palace',
      background: colors.sand,
    },
    {
      id: 'tiles',
      era: '1568, and the tiles from 1762',
      title: 'Find two matching tiles',
      body: "The Paradesi Synagogue's floor tiles came all the way from Canton in China. People here say no two are alike. Nobody I know has ever found a pair.",
      illustration: 'synagogue',
      background: colors.mint,
    },
    {
      id: 'your-turn',
      era: 'Today',
      title: "Now it's your turn",
      body: 'Walk the warehouse lanes and follow your nose to the ginger. Then biryani, then the synagogue. Tell me if you find those matching tiles.',
      illustration: 'warehouses',
      background: colors.clay,
    },
  ],
  food: [
    {
      id: 'biryani',
      name: '[Restaurant name]',
      detail: 'Kochi-style biryani · ₹₹ · 4 min',
      status: { text: 'Open now', tone: 'open' },
      mapsQuery: 'biryani Mattancherry',
      illustration: 'biryani',
      iconColor: colors.sand,
      tags: ['cheap'],
    },
    {
      id: 'leaf-meals',
      name: '[Vegetarian place]',
      detail: 'Kerala meals on a leaf · ₹ · 6 min',
      status: { text: 'Open now', tone: 'open' },
      mapsQuery: 'vegetarian meals Mattancherry',
      illustration: 'leafMeal',
      iconColor: colors.leaf,
      tags: ['vegetarian', 'mild', 'cheap'],
    },
    {
      id: 'seafood',
      name: '[Seafood place]',
      detail: 'Karimeen fry · ₹₹ · 9 min',
      status: { text: 'Opens at 7 pm', tone: 'warning' },
      mapsQuery: 'seafood Fort Kochi',
      illustration: 'seafood',
      iconColor: colors.sky,
      tags: ['seafood'],
    },
  ],
  sources: 'From Wikipedia, Wikivoyage and OpenStreetMap.',
  factChecked: false,
};
