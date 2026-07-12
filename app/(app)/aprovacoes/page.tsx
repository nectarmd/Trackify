import { requirePermission } from "@/lib/guard";
import { ClipboardCheck } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export default async function AprovacoesPage() {
  await requirePermission("approvals");

  await requirePermission("approvals");

  return (
    <ComingSoon
      icon={ClipboardCheck}
      title="Aprovações"
      description="Envie planilhas de horas para aprovação e acompanhe o status de cada período. Fluxo de aprovações chegando em breve."
    />
  );
}
