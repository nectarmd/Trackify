"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Info } from "lucide-react";
import {
  PERMISSION_KEYS,
  PERMISSION_LABELS,
  PERMISSION_GROUPS,
  type PermissionKey,
  type Permissions,
} from "@/lib/permissions";
import { updateMemberPermissions } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    // inline-flex + items-center + overflow-hidden: o pino fica no fluxo do
    // trilho e não tem como escapar. Com `absolute` sem âncora ele saía do card.
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex h-6 w-11 shrink-0 items-center overflow-hidden rounded-full px-0.5 transition-colors",
        checked ? "bg-[#03A9F4]" : "bg-slate-300"
      )}
    >
      <span
        className={cn(
          "h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

export function SettingsClient({
  permissions,
  workspaceName,
}: {
  permissions: Permissions;
  workspaceName: string;
}) {
  const router = useRouter();
  const [perms, setPerms] = useState<Permissions>(permissions);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    error?: string;
    message?: string;
  } | null>(null);

  const dirty = PERMISSION_KEYS.some((k) => perms[k] !== permissions[k]);

  function set(key: PermissionKey, value: boolean) {
    setPerms((p) => ({ ...p, [key]: value }));
    setFeedback(null);
  }

  async function save() {
    setSaving(true);
    setFeedback(null);
    const fd = new FormData();
    for (const k of PERMISSION_KEYS) fd.set(k, String(perms[k]));
    const res = await updateMemberPermissions(fd);
    setSaving(false);
    setFeedback(
      res?.error ? { error: res.error } : { message: res?.message ?? "Salvo." }
    );
    if (!res?.error) router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-3 rounded-lg border border-[#03A9F4]/30 bg-[#03A9F4]/5 p-4">
        <Info className="h-5 w-5 shrink-0 text-[#03A9F4]" />
        <p className="text-sm text-slate-700">
          Estas regras valem no banco de dados, não só nos menus. Um colaborador
          sem permissão não consegue acessar o dado nem por fora do app.
        </p>
      </div>

      {PERMISSION_GROUPS.map((group) => {
        const keys = PERMISSION_KEYS.filter(
          (k) => PERMISSION_LABELS[k].group === group
        );
        if (keys.length === 0) return null;

        return (
          <section
            key={group}
            className="rounded-lg border border-slate-200 bg-white"
          >
            <header className="flex items-center gap-2 border-b border-slate-200 bg-[#F3F4F6] px-4 py-2.5">
              <ShieldCheck className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-700">{group}</h2>
            </header>

            <div className="divide-y divide-slate-100">
              {keys.map((key) => {
                const { title, description } = PERMISSION_LABELS[key];
                return (
                  <div key={key} className="flex items-start gap-4 px-4 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800">
                        {title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {description}
                      </p>
                    </div>
                    <Toggle checked={perms[key]} onChange={(v) => set(key, v)} />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving || !dirty}>
          {saving ? "Salvando..." : "Salvar permissões"}
        </Button>
        {feedback?.error && (
          <p className="text-sm text-red-600">{feedback.error}</p>
        )}
        {feedback?.message && (
          <p className="text-sm text-green-700">{feedback.message}</p>
        )}
        {!feedback && dirty && (
          <p className="text-sm text-muted-foreground">
            Alterações não salvas.
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Aplica-se a todos os membros de <strong>{workspaceName}</strong>.
        Administradores não são afetados.
      </p>
    </div>
  );
}
