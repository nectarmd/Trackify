import { requirePermission } from "@/lib/guard";
import { getExpenses, getProjects } from "@/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { ExpensesClient } from "@/components/expenses/expenses-client";

export const dynamic = "force-dynamic";

export default async function DespesasPage() {
  await requirePermission("expenses");

  const [expenses, projects] = await Promise.all([
    getExpenses(),
    getProjects(false),
  ]);
  return (
    <div className="mx-auto max-w-5xl p-6">
      <PageHeader
        title="Despesas"
        description="Registre e acompanhe gastos por projeto."
      />
      <ExpensesClient expenses={expenses} projects={projects} />
    </div>
  );
}
