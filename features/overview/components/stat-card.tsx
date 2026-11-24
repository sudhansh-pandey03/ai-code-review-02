import type { Icon } from "@phosphor-icons/react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { StatValue } from "../types";

type StatCardProps = {
    label: string;
    icon: Icon;
    /** null shows an em dash (data unavailable) */
    stat: StatValue | null;
    /** Highlight the number in the destructive color when it is above 0. */
    alertWhenPositive?: boolean;
};

function WeeklyChange({ stat }: { stat: StatValue | null }) {
    if (!stat || stat.thisWeek === null) {
        return <p className="text-xs text-muted-foreground">&nbsp;</p>;
    }

    return (
        <p className="text-xs text-muted-foreground">
            +{stat.thisWeek} this week
        </p>
    );
}

export function StatCard({ label, icon: IconComponent, stat, alertWhenPositive }: StatCardProps) {
    const alert = alertWhenPositive && stat !== null && stat.value > 0;

    return (
        <Card>
            <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <IconComponent
                        className={cn("size-4", alert ? "text-destructive" : "text-muted-foreground")}
                    />
                </div>
                <p
                    className={cn(
                        "text-3xl font-semibold tabular-nums tracking-tight",
                        alert && "text-destructive"
                    )}
                >
                    {stat === null ? "—" : stat.value}
                </p>
                <WeeklyChange stat={stat} />
            </CardContent>
        </Card>
    );
}

export function StatCardSkeleton() {
    return (
        <Card>
            <CardContent className="flex flex-col gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-4 w-20" />
            </CardContent>
        </Card>
    );
}
