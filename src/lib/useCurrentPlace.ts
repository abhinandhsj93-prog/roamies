import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { nearestWithDistance, places, registerPlace } from '@/content/places';
import type { Place } from '@/content/types';
import { useLocationTarget } from '@/lib/locationTarget';

// Bundled places count as "here" within this distance; further away we ask the Roamies API.
const BUNDLED_RADIUS_KM = 1.5;
// Public URL of the Roamies places API (worker/), deployed to Cloudflare.
export const API_URL = process.env.EXPO_PUBLIC_ROAMIES_API_URL || 'https://roamies-api.abhinandhsj93.workers.dev';

export type CurrentPlace = {
  place: Place;
  // Set while Meera is writing the guide for a place nobody has opened before.
  loadingName?: string | null;
  loading: boolean;
  // Why we're showing a fallback place instead of where the user is.
  problem?: 'no-permission' | 'no-fix' | 'no-guide';
  // A searched-for place rather than the phone's location.
  picked?: string;
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

// A fresh fix when the phone can get one quickly, else the last known position.
async function currentPosition() {
  const fresh = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const timeout = wait(12000).then(() => null);
  return (await Promise.race([fresh, timeout])) ?? (await Location.getLastKnownPositionAsync());
}

// Picks the place for the user's location (or the place they searched for): a bundled one
// when close by, otherwise a live guide from the API. Falls back to the first bundled place.
export function useCurrentPlace(): CurrentPlace {
  const target = useLocationTarget();
  const [state, setState] = useState<CurrentPlace>({ place: places[0], loading: true });

  useEffect(() => {
    let cancelled = false;
    const picked = target.kind === 'picked' ? target.label : undefined;
    (async () => {
      setState((s) => ({ place: s.place, loading: true, picked }));
      try {
        let latitude: number;
        let longitude: number;
        if (target.kind === 'picked') {
          ({ latitude, longitude } = target);
        } else {
          const { granted } = await Location.requestForegroundPermissionsAsync();
          if (!granted) {
            if (!cancelled) setState((s) => ({ ...s, loading: false, problem: 'no-permission' }));
            return;
          }
          const pos = await currentPosition();
          if (cancelled) return;
          if (!pos) {
            setState((s) => ({ ...s, loading: false, problem: 'no-fix' }));
            return;
          }
          ({ latitude, longitude } = pos.coords);
        }
        const nearest = nearestWithDistance(latitude, longitude);
        if (nearest.km <= BUNDLED_RADIUS_KM || !API_URL) {
          setState({ place: nearest.place, loading: false, picked });
          return;
        }
        setState((s) => ({ ...s, loading: true, loadingName: null }));
        const live = await fetchLivePlace(latitude, longitude, (name) => {
          if (!cancelled) setState((s) => ({ ...s, loadingName: name }));
        });
        if (cancelled) return;
        if (live) {
          registerPlace(live);
          setState({ place: live, loading: false, picked });
        } else {
          setState((s) => ({ ...s, loading: false, problem: 'no-guide' }));
        }
      } catch {
        if (!cancelled) setState((s) => ({ ...s, loading: false, problem: 'no-guide' }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [target]);

  return state;
}
