import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { OverviewSkeleton } from "@/features/overview/components/overview-content";

export default function DashboardOverviewLoading() {
    return (
        <>
            <DashboardHeader title="Overview" description="Your AI reviews at a glance." />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-56" />
                    <Skeleton className="h-4 w-80 max-w-full" />
                </div>
                <OverviewSkeleton />
            </div>
        </>
    );
}
