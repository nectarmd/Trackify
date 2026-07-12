import { requirePermission } from "@/lib/guard";
import { Plane } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export default async function FolgasPage() {
  await requirePermission("time_off");

  await requirePermission("time_off");

  return (
    <ComingSoon
      icon={Plane}
      title="Folgas"
      description="Gerencie solicitações de férias, feriados e ausências da equipe. Em breve você poderá registrar e aprovar folgas por aqui."
    />
  );
}
