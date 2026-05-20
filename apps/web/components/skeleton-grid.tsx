type SkeletonGridProps = {
  count?: number;
};

export function SkeletonGrid({ count = 6 }: SkeletonGridProps) {
  return (
    <div className="prompt-grid" style={{ marginTop: 18 }}>
      {Array.from({ length: count }, (_, i) => (
        <div className="prompt-card" key={i} aria-hidden="true">
          <div className="skeleton-card" />
          <div className="skeleton-card skeleton-card-short" />
          <div className="skeleton-card skeleton-card-text" />
          <div className="skeleton-card skeleton-card-text" style={{ width: "45%" }} />
        </div>
      ))}
    </div>
  );
}
