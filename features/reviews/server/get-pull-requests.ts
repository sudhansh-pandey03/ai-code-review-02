import { prisma } from "@/lib/db";
import { getUserInstallationId } from "@/features/github/server/installation";

export type PullRequestStatus =
    | "pending"
    | "processing"
    | "reviewed"
    | "rate_limited"
    | "failed";

export type DashboardPullRequest = {
    id: string;
    repoFullName: string;
    prNumber: number;
    title: string;
    authorLogin: string | null;
    baseBranch: string;
    status: PullRequestStatus;
    /** AI-generated review markdown; null until the review finishes */
    reviewComment: string | null;
    reviewedAt: string | null;
    updatedAt: string;
    githubUrl: string;
};

const MAX_PULL_REQUESTS = 50;

/**
 * Loads the most recent pull requests (with their AI review) for the
 * GitHub App installation that belongs to this user.
 *
 * @returns `null` when the user has not installed the GitHub App.
 */
export async function getUserPullRequests(
    userId: string
): Promise<DashboardPullRequest[] | null> {
    const installationId = await getUserInstallationId(userId);

    if (installationId === null) {
        return null;
    }

    const pullRequests = await prisma.pullRequest.findMany({
        where: { installationId },
        orderBy: { updatedAt: "desc" },
        take: MAX_PULL_REQUESTS,
    });

    return pullRequests.map((pr) => ({
        id: pr.id,
        repoFullName: pr.repoFullName,
        prNumber: pr.prNumber,
        title: pr.title,
        authorLogin: pr.authorLogin,
        baseBranch: pr.baseBranch,
        status: pr.status as PullRequestStatus,
        reviewComment: pr.reviewComment,
        reviewedAt: pr.reviewedAt ? pr.reviewedAt.toISOString() : null,
        updatedAt: pr.updatedAt.toISOString(),
        githubUrl: `https://github.com/${pr.repoFullName}/pull/${pr.prNumber}`,
    }));
}
