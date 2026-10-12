import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { nearestWithDistance, places, registerPlace } from '@/content/places';
import type { Place } from '@/content/types';

// Bundled places count as "here" within this distance; further away we ask the Roamies API.
const BUNDLED_RADIUS_KM = 1.5;
// Public URL of the Roamies places API (worker/), deployed to Cloudflare.
const API_URL = process.env.EXPO_PUBLIC_ROAMIES_API_URL || 'https://roamies-api.abhinandhsj93.workers.dev';

export type CurrentPlace = {
  place: Place;
  // Set while Meera is writing the guide for a place nobody has opened before.
  loadingName?: string | null;
  loading: boolean;
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Asks the API for the guide to the user's locality. The first visitor to a place waits
// while it is written (up to about a minute); everyone after gets the cached copy.
async function fetchLivePlace(latitude: number, longitude: number, onWaiting: (name: string | null) => void) {
  if (!API_URL) return null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch(`${API_URL}/place?lat=${latitude.toFixed(5)}&lng=${longitude.toFixed(5)}`);
    const body = (await res.json()) as { status: string; place?: Place; name?: string };
    if (body.status === 'ready' && body.place) return body.place;
    if (body.status !== 'generating') return null;
    onWaiting(body.name ?? null);
    await wait(8000);
  }
  return null;
}

// Picks the place for the user's location: a bundled one when close by, otherwise a live
// guide from the API. Falls back to the first bundled place when location or the API fails.
export function useCurrentPlace(): CurrentPlace {
  const [state, setState] = useState<CurrentPlace>({ place: places[0], loading: true });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { granted } = await Location.requestForegroundPermissionsAsync();
        if (!granted) return;
        const pos =
          (await Location.getLastKnownPositionAsync()) ??
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (!pos || cancelled) return;
        const { latitude, longitude } = pos.coords;
        const nearest = nearestWithDistance(latitude, longitude);
        if (nearest.km <= BUNDLED_RADIUS_KM || !API_URL) {
          setState({ place: nearest.place, loading: false });
          return;
        }
        setState((s) => ({ ...s, loading: true, loadingName: null }));
        const live = await fetchLivePlace(latitude, longitude, (name) => {
          if (!cancelled) setState((s) => ({ ...s, loadingName: name }));
        });
        if (cancelled) return;
        if (live) {
          registerPlace(live);
          setState({ place: live, loading: false });
        } else {
          setState({ place: nearest.place, loading: false });
        }
      } catch {
        // Keep the fallback place.
      } finally {
        if (!cancelled) setState((s) => (s.loading ? { ...s, loading: false } : s));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
