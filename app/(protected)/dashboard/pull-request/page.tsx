import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { requireAuth } from "@/features/auth/actions";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { PullRequestList } from "@/features/reviews/components/pull-request-list";
import { getUserPullRequests } from "@/features/reviews/server/get-pull-requests";

export const metadata: Metadata = {
    title: "Pull Requests · Dashboard",
};

/**
 * Lists the user's pull requests together with the AI review for each one.
 */
export default async function DashboardPullRequestsPage() {
    const session = await requireAuth();
    const pullRequests = await getUserPullRequests(session.user.id);

    const header = (
        <DashboardHeader
            title="Pull Requests"
            description="Pull requests reviewed by the AI, with the review for each one."
        />
    );

    if (pullRequests === null) {
        return (
            <>
                {header}
                <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
                    <p className="text-sm text-muted-foreground">
                        Install the GitHub App first to see your pull requests.
                    </p>
                    <Button nativeButton={false} render={<Link href={DASHBOARD_ROUTES.github} />}>
                        Go to GitHub App
                    </Button>
                </div>
            </>
        );
    }

    return (
        <>
            {header}
            <PullRequestList pullRequests={pullRequests} />
        </>
    );
}
