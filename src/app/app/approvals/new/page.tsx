import type { Metadata } from "next";
import Link from "next/link";
import { getJsSolutionsOrganization, listWorkItems } from "@/business-state";
import { isCommandCenterWriteEnabled } from "@/command-center/write-access";
import { formatWorkLabel } from "@/command-center/work/constants";
import { ApprovalRequestForm } from "@/components/command-center/approvals/approval-request-form";
import { PageHeader } from "@/components/command-center/page-header";
import { ReadOnlyNotice } from "@/components/command-center/read-only-notice";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Request Approval",
};

export default async function NewApprovalPage() {
  const writesEnabled = isCommandCenterWriteEnabled();
  const organization = await getJsSolutionsOrganization();
  const workItems = writesEnabled
    ? await listWorkItems({ organizationId: organization.id })
    : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Request Approval"
        description="Record authorization for a proposed action. Approval is not execution."
        actions={
          <Link
            href="/app/approvals"
            className="text-sm text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 dark:focus-visible:outline-zinc-100"
          >
            Back to Approvals
          </Link>
        }
      />
      {writesEnabled ? (
        <ApprovalRequestForm
          workItems={workItems.map((item) => ({
            id: item.id,
            label: `${item.title} (${formatWorkLabel(item.status)})`,
          }))}
        />
      ) : (
        <ReadOnlyNotice />
      )}
    </div>
  );
}
