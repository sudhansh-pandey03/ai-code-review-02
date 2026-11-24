import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { UpgradeButton } from "@/features/billing/components/upgrade-button";
import { statusBadge } from "@/features/dashboard/lib/status-style";
import { PLAN_DETAILS } from "@/features/settings/lib/plan-details";
import type { OverviewUsage } from "../types";

export function UsageCard({ usage }: { usage: OverviewUsage }) {
    const { plan, used, limit } = usage;

    return (
        <Card>
            <CardHeader className="grid-cols-[1fr_auto]">
                <CardTitle>Plan &amp; usage</CardTitle>
                <span className={statusBadge(plan === "pro" ? "info" : "neutral")}>
                    {PLAN_DETAILS[plan].label}
                </span>
            </CardHeader>
            <CardContent>
                {limit === null ? (
                    <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{used}</span> reviews this month ·
                        unlimited on Pro
                    </p>
                ) : (
                    <Progress value={Math.min(100, (used / limit) * 100)}>
                        <ProgressLabel>Reviews this month</ProgressLabel>
                        <span className="ml-auto text-xs/relaxed text-muted-foreground tabular-nums">
                            {used} / {limit}
                        </span>
                    </Progress>
                )}
            </CardContent>
            {plan === "free" ? (
                <CardFooter>
                    <UpgradeButton />
                </CardFooter>
            ) : null}
        </Card>
    );
}

export function UsageCardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-1 w-full" />
            </CardContent>
        </Card>
    );
}
