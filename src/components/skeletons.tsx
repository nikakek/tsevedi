export function ResultsSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="card h-20" />
      <div className="bg-line h-8 w-2/3 rounded-lg" />
      <div className="card h-48" />
      <div className="card h-48" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="bg-line h-8 w-1/2 rounded-lg" />
      <div className="card h-64" />
    </div>
  );
}
