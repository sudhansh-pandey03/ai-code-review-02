import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { GitPullRequestIcon } from "@phosphor-icons/react/dist/ssr";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/features/dashboard/components/status-badge";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import type { ActivityItem } from "../types";

function ActivityEmpty({ connected }: { connected: boolean }) {
    return (
        <Empty className="border border-dashed border-border py-10">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <GitPullRequestIcon />
                </EmptyMedia>
                <EmptyTitle>No reviews yet</EmptyTitle>
                <EmptyDescription>
                    {connected
                        ? "Open a PR on a connected repo to get your first AI review."
                        : "Connect the GitHub App, then open a PR to get your first AI review."}
                </EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}

export function RecentActivity({ items, connected }: { items: ActivityItem[]; connected: boolean }) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Recent activity</CardTitle>
                {items.length > 0 ? (
                    <CardAction>
                        <Link
                            href={DASHBOARD_ROUTES.pullRequest}
                            className="text-xs text-muted-foreground hover:text-foreground"
                        >
                            View all →
                        </Link>
                    </CardAction>
                ) : null}
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <ActivityEmpty connected={connected} />
                ) : (
                    <ul className="-mx-2 flex flex-col">
                        {items.map((item) => (
                            <li key={item.id}>
                                <Link
                                    href={`${DASHBOARD_ROUTES.pullRequest}/${item.id}`}
                                    className="flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-muted"
                                >
                                    <GitPullRequestIcon className="size-4 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-medium">{item.title}</p>
                                        <p className="truncate text-[0.625rem] text-muted-foreground">
                                            {item.repoFullName} #{item.prNumber} ·{" "}
                                            {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                    <StatusBadge kind="pr" status={item.status} />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

export function RecentActivitySkeleton() {
    return (
        <Card className="h-full">
            <CardHeader>
                <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
                {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Skeleton className="size-4" />
                        <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-3 w-3/4" />
                            <Skeleton className="h-2.5 w-1/2" />
                        </div>
                        <Skeleton className="h-5 w-16" />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
