import { mattancherry } from './mattancherry';
import type { Place } from './types';

// Seeded neighbourhoods. Add the other Kochi areas here during the content pass;
// later this list comes from Firestore.
export const places: Place[] = [mattancherry];

export function getPlace(id: string) {
  return places.find((p) => p.id === id);
}

// Nearest seeded neighbourhood to a coordinate (equirectangular distance is plenty at this scale).
export function nearestPlace(latitude: number, longitude: number) {
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
  return best;
}
