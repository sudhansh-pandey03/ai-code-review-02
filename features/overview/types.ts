import type { UsageSummary } from "@/features/billing/server/usage";
import type { SubscriptionPlan } from "@/features/dashboard/lib/types";

export type OverviewInstallation =
    | { connected: false; installUrl: string }
    | {
          connected: true;
          accountLogin: string | null;
          accountType: string | null;
          /** null when the GitHub API could not be reached */
          repoCount: number | null;
          manageUrl: string;
      };

export type StatValue = {
    value: number;
    /** How many were added in the last 7 days; null when we can't tell. */
    thisWeek: number | null;
};

export type OverviewStats = {
    /** null when the GitHub API could not be reached or no installation */
    connectedRepos: StatValue | null;
    reviewed: StatValue;
    inProgress: StatValue;
    failed: StatValue;
};

export type RepoSummaryItem = {
    fullName: string;
    /** RepoSync.status, or null when the repo was never synced */
    syncStatus: string | null;
    lastSyncedAt: string | null;
};

export type RepoSummary = {
    repos: RepoSummaryItem[];
    /** true when the GitHub API call failed */
    error: boolean;
};

export type ActivityItem = {
    id: string;
    repoFullName: string;
    prNumber: number;
    title: string;
    status: string;
    updatedAt: string;
};

export type OverviewUsage = UsageSummary & {
    plan: SubscriptionPlan;
};

export type Overview = {
    installation: OverviewInstallation;
    stats: OverviewStats;
    repos: RepoSummary;
    recentActivity: ActivityItem[];
    usage: OverviewUsage;
};
