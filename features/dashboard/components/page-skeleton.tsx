import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";

type PageSkeletonProps = {
  title: string;
  description?: string;
  /** list = stacked cards, table = rows, card = one wide card */
  variant: "list" | "table" | "card";
};

/** Instant loading screen for a dashboard page while the server renders it. */
export function PageSkeleton({ title, description, variant }: PageSkeletonProps) {
  return (
    <>
      <DashboardHeader title={title} description={description} />
      <div className="flex flex-1 flex-col gap-3 p-4 md:p-6" aria-busy="true" aria-label="Loading">
        {variant === "list" &&
          Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        {variant === "table" && (
          <>
            <Skeleton className="h-8 w-full max-w-xs" />
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </>
        )}
        {variant === "card" && <Skeleton className="h-64 w-full max-w-2xl" />}
      </div>
    </>
  );
}
