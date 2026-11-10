interface SkeletonProps {
  rows: number;
  label?: string;
}

/** Glass placeholder rows while the catalog loads. */
export function Skeleton({ rows, label = 'Loading' }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      className="material-glass-thin space-y-4 rounded-xl p-4"
    >
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          data-skeleton-row=""
          className="flex items-center gap-3 motion-safe:animate-pulse"
        >
          <div className="size-[28px] shrink-0 rounded-[7px] bg-fill" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 rounded-xs bg-fill" />
            <div className="h-2 w-1/3 rounded-xs bg-fill" />
          </div>
        </div>
      ))}
    </div>
  );
}
