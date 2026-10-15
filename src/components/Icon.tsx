import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Stroke icons from the design canvas (24×24 grid).
export type IconName =
  | 'search'
  | 'plus'
  | 'chevron-right'
  | 'arrow-right'
  | 'close'
  | 'directions'
  | 'sun'
  | 'tag'
  | 'pin'
  | 'calendar'
  | 'compass'
  | 'user'
  | 'pencil'
  | 'phone'
  | 'back'
  | 'locate';

type Props = { name: IconName; size?: number; color: string; strokeWidth?: number };

export function Icon({ name, size = 22, color, strokeWidth = 2.2 }: Props) {
  const stroke = { stroke: color, strokeWidth, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      {name === 'search' && (
        <>
          <Circle cx={11} cy={11} r={7} {...stroke} />
          <Path d="M20 20l-4-4" {...stroke} />
        </>
      )}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" {...stroke} />}
      {name === 'chevron-right' && <Path d="M9 5l7 7-7 7" {...stroke} />}
      {name === 'back' && <Path d="M15 5l-7 7 7 7" {...stroke} />}
      {name === 'arrow-right' && <Path d="M5 12h14M13 6l6 6-6 6" {...stroke} />}
      {name === 'close' && <Path d="M6 6l12 12M18 6L6 18" {...stroke} />}
      {name === 'directions' && <Path d="M3 11l18-8-8 18-2-8z" {...stroke} />}
      {name === 'sun' && (
        <>
          <Circle cx={12} cy={12} r={4} {...stroke} />
          <Path
            d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
            {...stroke}
          />
        </>
      )}
      {name === 'tag' && (
        <>
          <Path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z" {...stroke} />
          <Circle cx={7.5} cy={7.5} r={1.5} {...stroke} />
        </>
      )}
      {name === 'pin' && (
        <Path
          d="M12 2a7 7 0 00-7 7c0 5.3 7 13 7 13s7-7.7 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z"
          fill={color}
        />
      )}
      {name === 'calendar' && (
        <>
          <Rect x={4} y={5} width={16} height={15} rx={3} {...stroke} />
          <Path d="M8 3v4M16 3v4M4 10h16" {...stroke} />
        </>
      )}
      {name === 'compass' && (
        <>
          <Circle cx={12} cy={12} r={9} {...stroke} />
          <Path d="M15.5 8.5l-2 5-5 2 2-5z" {...stroke} />
        </>
      )}
      {name === 'user' && (
        <>
          <Circle cx={12} cy={8} r={4} {...stroke} />
          <Path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" {...stroke} />
        </>
      )}
      {name === 'pencil' && (
        <>
          <Path d="M4 20h4L19 9l-4-4L4 16z" {...stroke} />
          <Path d="M13 7l4 4" {...stroke} />
        </>
      )}
      {name === 'locate' && (
        <>
          <Circle cx={12} cy={12} r={7} {...stroke} />
          <Circle cx={12} cy={12} r={2.5} fill={color} />
          <Path d="M12 2v3M12 19v3M2 12h3M19 12h3" {...stroke} />
        </>
      )}
      {name === 'phone' && (
        <Path
          d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"
          {...stroke}
        />
      )}
    </Svg>
  );
}
