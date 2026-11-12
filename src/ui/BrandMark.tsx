/** The small tile beside the brand name in the header. Decorative: the name is the label. */
export function BrandMark({ glyph }: { glyph: string }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-[22px] shrink-0 place-items-center rounded-xs bg-label font-mono text-[11px] font-bold text-label-inverse"
    >
      {glyph}
    </span>
  );
}
