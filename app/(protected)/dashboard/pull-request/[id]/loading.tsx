import { PageSkeleton } from "@/features/dashboard/components/page-skeleton";

export default function Loading() {
  return <PageSkeleton title="Pull Request" description="Loading the AI review…" variant="card" />;
}
