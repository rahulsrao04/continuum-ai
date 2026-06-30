export function ProjectListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="bg-[#12121A] border border-[#1E1E2E] rounded-lg p-4 animate-pulse"
        >
          <div className="h-4 bg-[#1E1E2E] rounded w-3/4 mb-2" />
          <div className="h-3 bg-[#1E1E2E] rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function CheckpointTimelineSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 bg-[#1E1E2E] rounded-full animate-pulse" />
            {i < 2 && <div className="w-0.5 h-full bg-[#1E1E2E] mt-2" />}
          </div>
          <div className="flex-1 bg-[#12121A] border border-[#1E1E2E] rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-[#1E1E2E] rounded w-1/2 mb-3" />
            <div className="space-y-2">
              <div className="h-3 bg-[#1E1E2E] rounded w-full" />
              <div className="h-3 bg-[#1E1E2E] rounded w-5/6" />
              <div className="h-3 bg-[#1E1E2E] rounded w-4/6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 animate-pulse">
      <div className="h-6 bg-[#1E1E2E] rounded w-1/3 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-[#1E1E2E] rounded w-full" />
        <div className="h-4 bg-[#1E1E2E] rounded w-5/6" />
        <div className="h-4 bg-[#1E1E2E] rounded w-4/6" />
      </div>
    </div>
  );
}
