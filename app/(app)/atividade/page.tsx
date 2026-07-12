import { requirePermission } from "@/lib/guard";
import { Activity } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export default async function AtividadePage() {
  await requirePermission("activity");

  await requirePermission("activity");

  return (
    <ComingSoon
      icon={Activity}
      title="Atividade"
      description="Acompanhe em tempo real o que a equipe está registrando e veja um feed de atividades recentes. Recurso em desenvolvimento."
    />
  );
}
