interface SkeletonProps {
  className?: string;
  lines?: number;
}

export default function Skeleton({ className = "", lines }: SkeletonProps) {
  if (lines) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`h-4 bg-[#ECE6DF] rounded-md animate-pulse ${i === lines - 1 ? "w-3/4" : "w-full"}`}
          />
        ))}
      </div>
    );
  }
  return <div className={`bg-[#ECE6DF] rounded-md animate-pulse ${className}`} />;
}
