import { getUserSubscription } from "@/features/billing/server/subscription";
import { getUsageSummary } from "@/features/billing/server/usage";
import { getGithubInstallUrl } from "@/features/github/utils/github-app";
import { prisma } from "@/lib/db";
import type { Overview, OverviewInstallation } from "../types";
import { getPullRequestStats, getRecentActivity } from "./activity";
import { getRepoSummary } from "./repo-summary";

function buildManageUrl(installationId: number, accountType: string | null, accountLogin: string | null) {
    if (accountType === "Organization" && accountLogin) {
        return `https://github.com/organizations/${accountLogin}/settings/installations/${installationId}`;
    }
    return `https://github.com/settings/installations/${installationId}`;
}

const EMPTY_STAT = { value: 0, thisWeek: 0 };

/**
 * Everything the dashboard overview page shows, scoped to one user.
 * Call only from server code after checking the session.
 */
export async function getOverview(userId: string): Promise<Overview> {
    const [installation, subscription, usageSummary] = await Promise.all([
        prisma.githubInstallation.findUnique({
            where: { userId },
            select: { installationId: true, accountLogin: true, accountType: true },
        }),
        getUserSubscription(userId),
        getUsageSummary(userId),
    ]);

    const usage = { ...usageSummary, plan: subscription.plan };

    if (!installation) {
        const notConnected: OverviewInstallation = {
            connected: false,
            installUrl: getGithubInstallUrl(userId),
        };

        return {
            installation: notConnected,
            stats: {
                connectedRepos: null,
                reviewed: EMPTY_STAT,
                inProgress: EMPTY_STAT,
                failed: EMPTY_STAT,
            },
            repos: { error: false, repos: [] },
            recentActivity: [],
            usage,
        };
    }

    const { installationId, accountLogin, accountType } = installation;

    const [prStats, recentActivity, repoResult] = await Promise.all([
        getPullRequestStats(installationId),
        getRecentActivity(installationId),
        getRepoSummary(installationId),
    ]);

    return {
        installation: {
            connected: true,
            accountLogin,
            accountType,
            repoCount: repoResult.totalCount,
            manageUrl: buildManageUrl(installationId, accountType, accountLogin),
        },
        stats: {
            connectedRepos:
                repoResult.totalCount === null
                    ? null
                    : // TODO: GitHub doesn't tell us when a repo was added to the installation,
                      // so there is no "+N this week" for repos.
                      { value: repoResult.totalCount, thisWeek: null },
            ...prStats,
        },
        repos: repoResult.summary,
        recentActivity,
        usage,
    };
}
