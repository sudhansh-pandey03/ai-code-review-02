import { PageSkeleton } from "@/features/dashboard/components/page-skeleton";

export default function Loading() {
  return <PageSkeleton title="Repositories" description="All public and private repositories available to the GitHub App." variant="table" />;
}
