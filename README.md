# Roamies

Roamies are AI travel friends. Open the app anywhere and a local persona for that region (Kerala = Meera) greets you at neighbourhood level ("Hey, you're in Mattancherry!") and tells you what's special, what to eat and where to go next. Tagline: "Friendly neighborhood travel guides."

## Product rules
- Place first, persona second: talk about the place before the guide introduces herself.
- No free chat. Each place has a branching tap script, generated once and cached. Never call the AI per tap.
- Personas are labelled as AI friends. Tone: warm, local, like a friend — never a textbook.
- Content accuracy matters: top places get a human fact-check before shipping.
- English-only MVP, but store a `lang` field on all content.

## MVP scope (build only this first)
1. Here screen: persona briefing, "See this first" cards, mood buttons.
2. Story mode: "Read more" opens 5 swipeable illustrated story slides.
3. "I'm hungry" popup with nearby food and filters.
4. Directions via Google Maps deep link:
   https://www.google.com/maps/dir/?api=1&destination=<place>&travelmode=walking
5. Google sign-in (guests can browse; sign in to save).
Launch area: 5–10 Kochi neighbourhoods (Fort Kochi, Mattancherry, …).
Later: Plans hub and trip planner, Explore (Near me · state · country · World), Essentials (emergency, toilets, pharmacies, hospitals), memory notes on the map, badges, travel map.

## Tech
- React Native (Expo), Android first.
- Firebase Auth (Google sign-in), Firestore as the source of truth.
- Upstash Redis as the hot cache; AI generation only for new places, behind a generation lock.
- Data: Wikipedia, Wikivoyage, OpenStreetMap (store with attribution). Google Places live only, no long-term caching. Mappls or Ola Maps for India. No scraping.
- Reverse geocoding gives locality → district → state → country, which picks the persona and drives the Explore scope bar.

## Design system
- One font: Figtree, weights 500 and 700, sizes 32/20/16/13 only.
- Colours: cream #FAF8F4 (base), ink #12302C (text and primary), turmeric #E8A33D (accent only).
- 8-pt spacing grid, 24px side margins, cards with radius 20–24 and soft ink-tinted shadows.
- Flat illustrations instead of photos for the MVP.
- Floating dark bottom bar (Here, Plan, Explore, Me) with a raised turmeric "Leave a note" button in the centre.
- Screen designs are in design/screens (PNG) and design/canvas (source).
