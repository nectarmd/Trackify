import { requirePermission } from "@/lib/guard";
import { getTags } from "@/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { TagsClient } from "@/components/tags/tags-client";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  await requirePermission("tags_view");

  const tags = await getTags();
  return (
    <div className="mx-auto max-w-4xl p-6">
      <PageHeader
        title="Tags"
        description="Categorize suas entradas de tempo."
      />
      <TagsClient tags={tags} />
    </div>
  );
}
