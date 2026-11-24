import { subDays } from "date-fns";

import { prisma } from "@/lib/db";
import type { ActivityItem, StatValue } from "../types";

const RECENT_ACTIVITY_LIMIT = 10;

const IN_PROGRESS_STATUSES = ["pending", "processing"];
// "failed" is set by the onFailure handler in review-pr-function.ts;
// "rate_limited" PRs were skipped because the plan's review limit was reached.
const FAILED_STATUSES = ["failed", "rate_limited"];

/** The most recently updated pull requests for this installation. */
export async function getRecentActivity(installationId: number): Promise<ActivityItem[]> {
    const pullRequests = await prisma.pullRequest.findMany({
        where: { installationId },
        orderBy: { updatedAt: "desc" },
        take: RECENT_ACTIVITY_LIMIT,
        select: {
            id: true,
            repoFullName: true,
            prNumber: true,
            title: true,
            status: true,
            updatedAt: true,
        },
    });

    return pullRequests.map((pr) => ({
        ...pr,
        updatedAt: pr.updatedAt.toISOString(),
    }));
}

/** PR counts by status, each with how many happened in the last 7 days. */
export async function getPullRequestStats(installationId: number): Promise<{
    reviewed: StatValue;
    inProgress: StatValue;
    failed: StatValue;
}> {
    const weekAgo = subDays(new Date(), 7);

    const [reviewed, reviewedWeek, inProgress, inProgressWeek, failed, failedWeek] =
        await Promise.all([
            prisma.pullRequest.count({ where: { installationId, status: "reviewed" } }),
            prisma.pullRequest.count({
                where: { installationId, status: "reviewed", reviewedAt: { gte: weekAgo } },
            }),
            prisma.pullRequest.count({
                where: { installationId, status: { in: IN_PROGRESS_STATUSES } },
            }),
            prisma.pullRequest.count({
                where: {
                    installationId,
                    status: { in: IN_PROGRESS_STATUSES },
                    updatedAt: { gte: weekAgo },
                },
            }),
            prisma.pullRequest.count({
                where: { installationId, status: { in: FAILED_STATUSES } },
            }),
            prisma.pullRequest.count({
                where: {
                    installationId,
                    status: { in: FAILED_STATUSES },
                    updatedAt: { gte: weekAgo },
                },
            }),
        ]);

    return {
        reviewed: { value: reviewed, thisWeek: reviewedWeek },
        inProgress: { value: inProgress, thisWeek: inProgressWeek },
        failed: { value: failed, thisWeek: failedWeek },
    };
}
