import { IssueDetail } from "@/components/neighbourhood/issue-detail";

export default async function PublicIssuePage({ params }: { params: Promise<{ id: string }> }) {
  return <IssueDetail id={(await params).id} backHref="/issues" />;
}
