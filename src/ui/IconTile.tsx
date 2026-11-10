import { cn } from './cn';

export type IconColorToken =
  | 'encryption-1'
  | 'encryption-2'
  | 'encryption-3'
  | 'encryption-4'
  | 'hashing-1'
  | 'hashing-2'
  | 'hashing-3'
  | 'encoding-1'
  | 'encoding-2'
  | 'neutral';

// Literal class names, so Tailwind generates each one.
const BACKGROUNDS: Record<IconColorToken, string> = {
  'encryption-1': 'bg-icon-encryption-1',
  'encryption-2': 'bg-icon-encryption-2',
  'encryption-3': 'bg-icon-encryption-3',
  'encryption-4': 'bg-icon-encryption-4',
  'hashing-1': 'bg-icon-hashing-1',
  'hashing-2': 'bg-icon-hashing-2',
  'hashing-3': 'bg-icon-hashing-3',
  'encoding-1': 'bg-icon-encoding-1',
  'encoding-2': 'bg-icon-encoding-2',
  neutral: 'bg-icon-neutral',
};

const SIZES = {
  sm: 'size-6 rounded-xs text-[0.59375rem]',
  md: 'size-[28px] rounded-[7px] text-[0.6875rem]',
  lg: 'size-[38px] rounded-[10px] text-[0.8125rem] sm:size-11 sm:rounded-[11px] sm:text-[0.9375rem]',
} as const;

interface IconTileProps {
  glyph: string;
  color: IconColorToken;
  size?: 'sm' | 'md' | 'lg';
}

/** A colored tile with a short monospace glyph. Decorative: the row or card beside it names it. */
export function IconTile({ glyph, color, size = 'md' }: IconTileProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center font-mono font-bold text-icon-glyph select-none',
        BACKGROUNDS[color],
        SIZES[size],
      )}
    >
      {glyph}
    </span>
  );
}
