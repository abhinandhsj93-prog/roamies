import { mattancherry } from './mattancherry';
import type { Place } from './types';

// Bundled neighbourhoods, plus places fetched live from the Roamies API this session
// (registerPlace), so the Story and I'm hungry screens can find them by id.
export const places: Place[] = [mattancherry];

export function registerPlace(place: Place) {
  const i = places.findIndex((p) => p.id === place.id);
  if (i >= 0) places[i] = place;
  else places.push(place);
}

export function getPlace(id: string) {
  return places.find((p) => p.id === id);
}

// Nearest seeded neighbourhood to a coordinate (equirectangular distance is plenty at this scale).
export function nearestPlace(latitude: number, longitude: number) {
  return nearestWithDistance(latitude, longitude).place;
}

// Nearest bundled place and its rough distance in km.
export function nearestWithDistance(latitude: number, longitude: number) {
  const cos = Math.cos((latitude * Math.PI) / 180);
  let best = places[0];
  let bestDist = Infinity;
  for (const p of places) {
    const dx = (p.coords.longitude - longitude) * cos;
    const dy = p.coords.latitude - latitude;
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      best = p;
      bestDist = d;
    }
  }
  return { place: best, km: Math.sqrt(bestDist) * 111.32 };
}
