"use client";

import { formatDistanceToNow } from "date-fns";
import {
    ArrowSquareOutIcon,
    CaretDownIcon,
    GitPullRequestIcon,
} from "@phosphor-icons/react";

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { statusBadge, type statusBadgeClass } from "@/features/dashboard/lib/status-style";
import type {
    DashboardPullRequest,
    PullRequestStatus,
} from "../server/get-pull-requests";
import { ReviewMarkdown } from "./review-markdown";

const STATUS_DISPLAY: Record<
    PullRequestStatus,
    { label: string; tone: keyof typeof statusBadgeClass }
> = {
    pending: { label: "Pending", tone: "neutral" },
    processing: { label: "Reviewing", tone: "info" },
    reviewed: { label: "Reviewed", tone: "success" },
    rate_limited: { label: "Limit reached", tone: "warning" },
};

function getStatusDisplay(status: PullRequestStatus) {
    return STATUS_DISPLAY[status] ?? STATUS_DISPLAY.pending;
}

function ReviewBody({ pr }: { pr: DashboardPullRequest }) {
    if (pr.reviewComment) {
        return <ReviewMarkdown markdown={pr.reviewComment} />;
    }

    let message = "No AI review for this pull request yet.";

    if (pr.status === "pending" || pr.status === "processing") {
        message = "The AI review is in progress. Refresh the page in a minute.";
    } else if (pr.status === "rate_limited") {
        message = "Not reviewed: your plan's review limit was reached.";
    } else if (pr.status === "reviewed") {
        message = "Reviewed, but there was no code to comment on.";
    }

    return <p className="text-xs text-muted-foreground">{message}</p>;
}

function PullRequestItem({ pr }: { pr: DashboardPullRequest }) {
    const status = getStatusDisplay(pr.status);
    const updated = formatDistanceToNow(new Date(pr.updatedAt), { addSuffix: true });

    return (
        <Collapsible className="group/pr rounded-lg bg-card ring-1 ring-foreground/10">
            <div className="flex items-start gap-3 p-4">
                <GitPullRequestIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                <CollapsibleTrigger className="flex min-w-0 flex-1 cursor-pointer flex-col items-start gap-1 text-left outline-none focus-visible:underline">
                    <span className="flex w-full min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-medium">{pr.title}</span>
                        <CaretDownIcon className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[open]/pr:rotate-180" />
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {pr.repoFullName} #{pr.prNumber}
                        {pr.authorLogin ? ` · by ${pr.authorLogin}` : ""}
                        {` · into ${pr.baseBranch} · updated ${updated}`}
                    </span>
                </CollapsibleTrigger>

                <div className="flex shrink-0 items-center gap-2">
                    <span className={statusBadge(status.tone)}>{status.label}</span>
                    <a
                        href={pr.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open PR #${pr.prNumber} on GitHub`}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <ArrowSquareOutIcon className="size-4" />
                    </a>
                </div>
            </div>

            <CollapsibleContent className="border-t border-border px-4 py-4 sm:pl-11">
                <p className="mb-3 text-xs font-medium text-muted-foreground">AI review</p>
                <ReviewBody pr={pr} />
            </CollapsibleContent>
        </Collapsible>
    );
}

export function PullRequestList({ pullRequests }: { pullRequests: DashboardPullRequest[] }) {
    if (pullRequests.length === 0) {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <GitPullRequestIcon />
                    </EmptyMedia>
                    <EmptyTitle>No pull requests yet</EmptyTitle>
                    <EmptyDescription>
                        Open a pull request in a repository where the GitHub App is installed. Its AI review will show up here.
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return (
        <div className="flex flex-col gap-3 p-4 md:p-6">
            {pullRequests.map((pr) => (
                <PullRequestItem key={pr.id} pr={pr} />
            ))}
        </div>
    );
}
