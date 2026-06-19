import { Skeleton } from "./ui/skeleton";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#FDFAF5] p-8">
      <div className="mx-auto max-w-6xl">
        <Skeleton className="mb-8 h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
