import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { nearestPlace, places } from '@/content/places';
import type { Place } from '@/content/types';

// Picks the seeded neighbourhood closest to the user. Falls back to the first place
// when location is denied or unavailable, so the screen always has something to show.
export function useCurrentPlace(): Place {
  const [place, setPlace] = useState<Place>(places[0]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { granted } = await Location.requestForegroundPermissionsAsync();
        if (!granted) return;
        const pos =
          (await Location.getLastKnownPositionAsync()) ??
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (!cancelled && pos) setPlace(nearestPlace(pos.coords.latitude, pos.coords.longitude));
      } catch {
        // Keep the fallback place.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return place;
}
