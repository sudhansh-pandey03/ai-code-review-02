import {
    CheckCircleIcon,
    GitBranchIcon,
    HourglassMediumIcon,
    WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

import { getOverview } from "../server/get-overview";
import { InstallationCard, InstallationCardSkeleton } from "./installation-card";
import { RecentActivity, RecentActivitySkeleton } from "./recent-activity";
import { RepoSummary, RepoSummarySkeleton } from "./repo-summary";
import { StatCard, StatCardSkeleton } from "./stat-card";
import { UsageCard, UsageCardSkeleton } from "./usage-card";

/** Stat row on top; below, activity on the left and side cards on the right. */
function OverviewGrid({
    stats,
    activity,
    side,
}: {
    stats: React.ReactNode;
    activity: React.ReactNode;
    side: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats}</div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <div className="min-w-0">{activity}</div>
                <div className="flex min-w-0 flex-col gap-4">{side}</div>
            </div>
        </div>
    );
}

export async function OverviewContent({ userId }: { userId: string }) {
    const overview = await getOverview(userId);
    const connected = overview.installation.connected;

    return (
        <OverviewGrid
            stats={
                <>
                    <StatCard label="Connected repositories" icon={GitBranchIcon} stat={overview.stats.connectedRepos} />
                    <StatCard label="PRs reviewed" icon={CheckCircleIcon} stat={overview.stats.reviewed} />
                    <StatCard label="In progress / pending" icon={HourglassMediumIcon} stat={overview.stats.inProgress} />
                    <StatCard
                        label="Failed reviews"
                        icon={WarningCircleIcon}
                        stat={overview.stats.failed}
                        alertWhenPositive
                    />
                </>
            }
            activity={<RecentActivity items={overview.recentActivity} connected={connected} />}
            side={
                <>
                    <InstallationCard installation={overview.installation} />
                    <UsageCard usage={overview.usage} />
                    <RepoSummary summary={overview.repos} connected={connected} />
                </>
            }
        />
    );
}

export function OverviewSkeleton() {
    return (
        <OverviewGrid
            stats={Array.from({ length: 4 }, (_, i) => (
                <StatCardSkeleton key={i} />
            ))}
            activity={<RecentActivitySkeleton />}
            side={
                <>
                    <InstallationCardSkeleton />
                    <UsageCardSkeleton />
                    <RepoSummarySkeleton />
                </>
            }
        />
    );
}
