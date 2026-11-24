import {
  PR_STATUS_DISPLAY,
  statusBadge,
  SYNC_STATUS_DISPLAY,
} from "@/features/dashboard/lib/status-style";

type StatusBadgeProps =
  | { kind: "pr"; status: string; className?: string }
  | { kind: "sync"; status: string | null; className?: string };

/** One badge for both PR review statuses and repository sync statuses. */
export function StatusBadge({ kind, status, className }: StatusBadgeProps) {
  const display =
    kind === "pr"
      ? PR_STATUS_DISPLAY[status] ?? PR_STATUS_DISPLAY.pending
      : SYNC_STATUS_DISPLAY[status ?? "none"] ?? SYNC_STATUS_DISPLAY.none;

  return <span className={statusBadge(display.tone, className)}>{display.label}</span>;
}
