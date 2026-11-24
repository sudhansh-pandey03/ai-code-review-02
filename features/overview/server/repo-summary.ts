import { getInstallationReposPage } from "@/features/github/server/repos";
import { prisma } from "@/lib/db";
import type { RepoSummary } from "../types";

const REPO_SUMMARY_LIMIT = 5;

/**
 * The 5 most recently updated repos the GitHub App can access, with their
 * codebase-sync status, plus the total number of accessible repos.
 */
export async function getRepoSummary(
    installationId: number
): Promise<{ summary: RepoSummary; totalCount: number | null }> {
    try {
        // First page (up to 100 repos) is enough to pick the 5 most recently updated.
        const page = await getInstallationReposPage(installationId, 1);

        const topRepos = [...page.repos]
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, REPO_SUMMARY_LIMIT);

        const syncs = await prisma.repoSync.findMany({
            where: { repoFullName: { in: topRepos.map((repo) => repo.fullName) } },
            select: { repoFullName: true, status: true, syncedAt: true },
        });
        const syncByRepo = new Map(syncs.map((sync) => [sync.repoFullName, sync]));

        return {
            totalCount: page.totalCount,
            summary: {
                error: false,
                repos: topRepos.map((repo) => {
                    const sync = syncByRepo.get(repo.fullName);
                    return {
                        fullName: repo.fullName,
                        syncStatus: sync?.status ?? null,
                        lastSyncedAt: sync?.syncedAt?.toISOString() ?? null,
                    };
                }),
            },
        };
    } catch (error) {
        console.error("Failed to load repositories for overview", error);
        return { totalCount: null, summary: { error: true, repos: [] } };
    }
}
