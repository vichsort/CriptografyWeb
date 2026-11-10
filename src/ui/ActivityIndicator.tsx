import type { CSSProperties } from 'react';

const SIZES = {
  sm: { box: 14, spokeWidth: 1.6, spokeHeight: 4.2 },
  md: { box: 18, spokeWidth: 2, spokeHeight: 5.4 },
} as const;

const SPOKES = Array.from({ length: 8 }, (_, i) => i);

interface ActivityIndicatorProps {
  size?: 'sm' | 'md';
  label?: string;
}

/** The iOS activity indicator: eight spokes fading in turn. The only spinner in the app. */
export function ActivityIndicator({ size = 'md', label = 'Loading' }: ActivityIndicatorProps) {
  const { box, spokeWidth, spokeHeight } = SIZES[size];
  return (
    <span
      role="progressbar"
      aria-label={label}
      className="relative inline-block shrink-0"
      style={{ width: box, height: box }}
    >
      {SPOKES.map((i) => {
        const style: CSSProperties = {
          width: spokeWidth,
          height: spokeHeight,
          marginLeft: -spokeWidth / 2,
          transformOrigin: `${spokeWidth / 2}px ${box / 2}px`,
          transform: `rotate(${i * 45}deg)`,
          animationDelay: `${(i - 7) * 0.1}s`,
        };
        return (
          <span
            key={i}
            data-spoke=""
            className="animate-activity-spoke absolute top-0 left-1/2 rounded-xs bg-current opacity-15"
            style={style}
          />
        );
      })}
    </span>
  );
}
