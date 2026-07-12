import { getClients } from "@/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { ClientsClient } from "@/components/clients/clients-client";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await getClients(true);
  return (
    <div className="mx-auto max-w-4xl p-6">
      <PageHeader
        title="Clientes"
        description="Organize seus projetos por cliente."
      />
      <ClientsClient clients={clients} />
    </div>
  );
}
