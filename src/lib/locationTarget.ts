import { useSyncExternalStore } from 'react';

// Which spot the Here screen is about: wherever the phone is, or a place the user searched for.
export type LocationTarget =
  | { kind: 'gps'; nonce: number } // nonce changes to ask for a fresh fix
  | { kind: 'picked'; latitude: number; longitude: number; label: string };

let target: LocationTarget = { kind: 'gps', nonce: 0 };
const listeners = new Set<() => void>();

function set(next: LocationTarget) {
  target = next;
  listeners.forEach((l) => l());
}

export const pickPlace = (latitude: number, longitude: number, label: string) =>
  set({ kind: 'picked', latitude, longitude, label });

export const backToMyLocation = () => set({ kind: 'gps', nonce: target.kind === 'gps' ? target.nonce + 1 : 0 });

export function useLocationTarget() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => target,
  );
}
