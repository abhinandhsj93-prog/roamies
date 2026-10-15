import { useEffect, useState } from 'react';

// Current temperature from Open-Meteo (free, no key). Returns null until loaded or on failure.
export function useTemperature(latitude: number, longitude: number) {
  const [celsius, setCelsius] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`,
      { signal: controller.signal },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const t = data?.current?.temperature_2m;
        if (typeof t === 'number') setCelsius(Math.round(t));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [latitude, longitude]);

  return celsius;
}
