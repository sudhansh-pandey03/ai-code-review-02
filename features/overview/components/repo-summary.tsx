import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { GitBranchIcon } from "@phosphor-icons/react/dist/ssr";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/features/dashboard/components/status-badge";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import type { RepoSummary as RepoSummaryData } from "../types";

function RepoSummaryBody({ summary, connected }: { summary: RepoSummaryData; connected: boolean }) {
    if (!connected) {
        return (
            <p className="text-xs text-muted-foreground">
                Connect the GitHub App to see your repositories here.
            </p>
        );
    }

    if (summary.error) {
        return (
            <p className="text-xs text-muted-foreground">
                Couldn&apos;t load repositories from GitHub. Try refreshing in a moment.
            </p>
        );
    }

    if (summary.repos.length === 0) {
        return (
            <p className="text-xs text-muted-foreground">
                No repositories yet. Add repositories to the GitHub App installation to review them.
            </p>
        );
    }

    return (
        <ul className="divide-y divide-border">
            {summary.repos.map((repo) => (
                <li key={repo.fullName} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <GitBranchIcon className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{repo.fullName}</p>
                        <p className="text-[0.625rem] text-muted-foreground">
                            {repo.lastSyncedAt
                                ? `Synced ${formatDistanceToNow(new Date(repo.lastSyncedAt), { addSuffix: true })}`
                                : "Never synced"}
                        </p>
                    </div>
                    <StatusBadge kind="sync" status={repo.syncStatus} />
                </li>
            ))}
        </ul>
    );
}

export function RepoSummary({ summary, connected }: { summary: RepoSummaryData; connected: boolean }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Repositories</CardTitle>
                {connected ? (
                    <CardAction>
                        <Link
                            href={DASHBOARD_ROUTES.repos}
                            className="text-xs text-muted-foreground hover:text-foreground"
                        >
                            View all →
                        </Link>
                    </CardAction>
                ) : null}
            </CardHeader>
            <CardContent>
                <RepoSummaryBody summary={summary} connected={connected} />
            </CardContent>
        </Card>
    );
}

export function RepoSummarySkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="space-y-3">
                {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Skeleton className="size-4" />
                        <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-3 w-40" />
                            <Skeleton className="h-2.5 w-24" />
                        </div>
                        <Skeleton className="h-5 w-14" />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
