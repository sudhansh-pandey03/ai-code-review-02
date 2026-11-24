import { PageSkeleton } from "@/features/dashboard/components/page-skeleton";

export default function Loading() {
  return <PageSkeleton title="GitHub App" description="Install or disconnect the reviewer app on your GitHub account." variant="card" />;
}
