"use client";

export function InfiniteScrollLoader() {
  return (
    <div className="infinite-loader" aria-label="Loading">
      <div className="infinite-loader-track">
        <div className="infinite-loader-bar" />
      </div>
      <span className="infinite-loader-label">LOADING NEXT BATCH</span>
    </div>
  );
}
