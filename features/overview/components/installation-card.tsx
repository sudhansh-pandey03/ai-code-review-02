import { ArrowSquareOutIcon, GithubLogoIcon } from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { statusBadge, statusButtonClass } from "@/features/dashboard/lib/status-style";
import type { OverviewInstallation } from "../types";

function repoCountText(repoCount: number | null) {
    if (repoCount === null) {
        return "Couldn't load repositories from GitHub right now.";
    }
    if (repoCount === 1) {
        return "1 repository accessible";
    }
    return `${repoCount} repositories accessible`;
}

export function InstallationCard({ installation }: { installation: OverviewInstallation }) {
    return (
        <Card>
            <CardHeader className="grid-cols-[1fr_auto]">
                <div className="flex flex-col gap-1">
                    <CardTitle className="flex items-center gap-2">
                        <GithubLogoIcon className="size-4" />
                        GitHub App
                    </CardTitle>
                    <CardDescription>
                        {installation.connected
                            ? "Reviews run on new pull requests automatically."
                            : "Install the app to start getting AI reviews."}
                    </CardDescription>
                </div>
                <span className={statusBadge(installation.connected ? "success" : "neutral")}>
                    {installation.connected ? "Connected" : "Not connected"}
                </span>
            </CardHeader>

            {installation.connected ? (
                <CardContent className="space-y-1 text-xs">
                    <p>
                        Installed on{" "}
                        <span className="font-medium">@{installation.accountLogin ?? "unknown"}</span>
                    </p>
                    <p className="text-muted-foreground">{repoCountText(installation.repoCount)}</p>
                </CardContent>
            ) : null}

            <CardFooter>
                {installation.connected ? (
                    <Button
                        variant="outline"
                        nativeButton={false}
                        render={<a href={installation.manageUrl} target="_blank" rel="noopener noreferrer" />}
                    >
                        Manage on GitHub
                        <ArrowSquareOutIcon data-icon="inline-end" />
                    </Button>
                ) : (
                    <Button
                        nativeButton={false}
                        className={statusButtonClass.success}
                        render={<a href={installation.installUrl} />}
                    >
                        <GithubLogoIcon data-icon="inline-start" />
                        Connect GitHub App
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}

export function InstallationCardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-48" />
            </CardHeader>
            <CardContent className="space-y-2">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-32" />
            </CardContent>
            <CardFooter>
                <Skeleton className="h-7 w-36" />
            </CardFooter>
        </Card>
    );
}
