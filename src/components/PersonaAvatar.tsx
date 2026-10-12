import type { ReactNode } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

// Persona avatars, ported from design/canvas/Main.dc.html.
export type PersonaId = 'meera' | 'kenji' | 'lucia' | 'amara';

const BODY = 'M7 36c2-7 7-10 13-10s11 3 13 10a20 20 0 01-26 0z';

const personas: Record<PersonaId, { bg: string; shirt: string; skin: string; hair: ReactNode }> = {
  meera: {
    bg: '#FBE3B8',
    shirt: '#E8A33D',
    skin: '#B9805A',
    hair: (
      <>
        <Path d="M12.5 16.5c0-5 3.4-8 7.5-8s7.5 3 7.5 8c-2-3-4.6-4.2-7.5-4.2s-5.5 1.2-7.5 4.2z" fill="#12302C" />
        <Circle cx={27.5} cy={10.5} r={3.6} fill="#12302C" />
      </>
    ),
  },
  kenji: {
    bg: '#E2EEF3',
    shirt: '#2E6A61',
    skin: '#E2B48C',
    hair: <Path d="M12.3 17c-.5-5.5 3-9 7.7-9s8.2 3.5 7.7 9c-1.4-2.6-3.6-4-7.7-4s-6.3 1.4-7.7 4z" fill="#2A2A2A" />,
  },
  lucia: {
    bg: '#F8E3E0',
    shirt: '#C0533A',
    skin: '#D9A273',
    hair: (
      <Path
        d="M11.5 26c-1-4-1-8 0-11 1.5-4.5 5-6.5 8.5-6.5s7 2 8.5 6.5c1 3 1 7 0 11-1-3-1.5-6-2-9-2-2-4-3-6.5-3s-4.5 1-6.5 3c-.5 3-1 6-2 9z"
        fill="#5A3420"
      />
    ),
  },
  amara: {
    bg: '#E6F0DA',
    shirt: '#2E6A61',
    skin: '#7A4E33',
    hair: (
      <>
        <Path d="M12 15c0-4.5 3.5-7 8-7s8 2.5 8 7z" fill="#1E1E1E" />
        <Path d="M26 14.5h6" stroke="#1E1E1E" strokeWidth={2.4} strokeLinecap="round" />
      </>
    ),
  },
};

export function PersonaAvatar({ persona, size = 56 }: { persona: PersonaId; size?: number }) {
  const p = personas[persona];
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessible={false}>
      <Circle cx={20} cy={20} r={20} fill={p.bg} />
      <Path d={BODY} fill={p.shirt} />
      <Circle cx={20} cy={17} r={7.5} fill={p.skin} />
      {p.hair}
    </Svg>
  );
}
