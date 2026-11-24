import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeftIcon, ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/features/auth/actions";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { StatusBadge } from "@/features/dashboard/components/status-badge";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { getUserInstallationId } from "@/features/github/server/installation";
import { ReviewMarkdown } from "@/features/reviews/components/review-markdown";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
    title: "Pull Request · Dashboard",
};

type PullRequestPageProps = {
    params: Promise<{ id: string }>;
};

/** One pull request with its full AI review. */
export default async function PullRequestDetailPage({ params }: PullRequestPageProps) {
    const { id } = await params;
    const session = await requireAuth();
    const installationId = await getUserInstallationId(session.user.id);

    // Only show PRs that belong to this user's installation.
    const pr = installationId
        ? await prisma.pullRequest.findFirst({ where: { id, installationId } })
        : null;

    if (!pr) {
        notFound();
    }

    const githubUrl = `https://github.com/${pr.repoFullName}/pull/${pr.prNumber}`;

    return (
        <>
            <DashboardHeader title={pr.title} description={`${pr.repoFullName} #${pr.prNumber}`} />
            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="ghost"
                        nativeButton={false}
                        render={<Link href={DASHBOARD_ROUTES.pullRequest} />}
                    >
                        <ArrowLeftIcon data-icon="inline-start" />
                        All pull requests
                    </Button>
                    <Button
                        variant="outline"
                        className="ml-auto"
                        nativeButton={false}
                        render={<a href={githubUrl} target="_blank" rel="noopener noreferrer" />}
                    >
                        Open on GitHub
                        <ArrowSquareOutIcon data-icon="inline-end" />
                    </Button>
                </div>

                <Card className="max-w-4xl">
                    <CardHeader className="grid-cols-[1fr_auto]">
                        <div className="flex min-w-0 flex-col gap-1">
                            <CardTitle className="truncate">{pr.title}</CardTitle>
                            <p className="text-xs text-muted-foreground">
                                {pr.authorLogin ? `by ${pr.authorLogin} · ` : ""}into {pr.baseBranch} · updated{" "}
                                {formatDistanceToNow(pr.updatedAt, { addSuffix: true })}
                            </p>
                        </div>
                        <StatusBadge kind="pr" status={pr.status} />
                    </CardHeader>
                    <CardContent className="border-t border-border pt-4">
                        {pr.reviewComment ? (
                            <ReviewMarkdown markdown={pr.reviewComment} />
                        ) : (
                            <p className="text-xs text-muted-foreground">
                                No AI review for this pull request yet.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
