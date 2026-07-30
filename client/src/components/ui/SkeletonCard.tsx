/**
 * SkeletonCard — reusable shimmer placeholder for card-shaped content.
 * Drop-in replacement for any card while data is loading.
 */
export function SkeletonCard({ lines = 3, showImage = false }: { lines?: number; showImage?: boolean }) {
  return (
    <div className="skeleton-card animate-fade-in">
      {showImage && (
        <div className="skeleton w-full h-40 rounded-xl mb-4" />
      )}
      <div className="skeleton w-2/3 h-4 mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton skeleton-row"
          style={{ width: `${100 - i * 12}%`, animationDelay: `${i * 80}ms` }}
        />
      ))}
      <div className="skeleton w-1/3 h-8 rounded-xl mt-4" />
    </div>
  );
}

/** Grid of skeleton cards for marketplace / asset listings */
export function SkeletonGrid({ count = 6, showImage = true }: { count?: number; showImage?: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} showImage={showImage} lines={3} />
      ))}
    </div>
  );
}

/** Skeleton for a single stat card */
export function SkeletonStat() {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <div className="skeleton w-24 h-3 rounded" />
        <div className="skeleton w-8 h-8 rounded-lg" />
      </div>
      <div className="skeleton w-32 h-7 rounded mb-1" />
      <div className="skeleton w-20 h-3 rounded" />
    </div>
  );
}

/** Row of skeleton stat cards */
export function SkeletonStatRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStat key={i} />
      ))}
    </div>
  );
}
