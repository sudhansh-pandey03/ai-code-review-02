import type { Metadata } from "next";
import { Suspense } from "react";
import { GithubLogoIcon } from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";
import { requireAuth } from "@/features/auth/actions";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { statusButtonClass } from "@/features/dashboard/lib/status-style";
import { getInstallationStatus } from "@/features/github/server/installation";
import { getGithubInstallUrl } from "@/features/github/utils/github-app";
import { OverviewContent, OverviewSkeleton } from "@/features/overview/components/overview-content";

export const metadata: Metadata = {
    title: "Overview · Dashboard",
};

function getFirstName(name: string | null | undefined) {
    const first = name?.trim().split(/\s+/)[0];
    return first || "there";
}

export default async function DashboardOverviewPage() {
    const session = await requireAuth();
    const installation = await getInstallationStatus(session.user.id);

    return (
        <>
            <DashboardHeader title="Overview" description="Your AI reviews at a glance." />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight">
                            Welcome back, {getFirstName(session.user.name)}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {installation.connected
                                ? "Here's what the AI reviewer has been up to."
                                : "Connect the GitHub App to start getting AI reviews on your pull requests."}
                        </p>
                    </div>
                    {installation.connected ? null : (
                        <Button
                            nativeButton={false}
                            className={statusButtonClass.success}
                            render={<a href={getGithubInstallUrl(session.user.id)} />}
                        >
                            <GithubLogoIcon data-icon="inline-start" />
                            Connect GitHub App
                        </Button>
                    )}
                </div>

                <Suspense fallback={<OverviewSkeleton />}>
                    <OverviewContent userId={session.user.id} />
                </Suspense>
            </div>
        </>
    );
}
