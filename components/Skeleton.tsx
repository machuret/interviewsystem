type Props = {
  lines?: number;
  className?: string;
};

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`skeleton h-4 rounded ${className}`} />;
}

export function SkeletonCard({ lines = 3 }: Props) {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="skeleton h-9 w-9 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="w-1/3" />
          <SkeletonLine className="w-1/5 h-3" />
        </div>
        <div className="skeleton h-6 w-16 rounded-full" />
      </div>
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <SkeletonLine key={i} className={i === lines - 2 ? "w-2/3" : "w-full"} />
      ))}
    </div>
  );
}

export default function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={3} />
      ))}
    </div>
  );
}
