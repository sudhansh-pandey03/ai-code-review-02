import { PageSkeleton } from "@/features/dashboard/components/page-skeleton";

export default function Loading() {
  return <PageSkeleton title="Pull Requests" description="Pull requests reviewed by the AI, with the review for each one." variant="list" />;
}
