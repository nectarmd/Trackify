"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Trash2, Building2, Lock, Mail, UserRound } from "lucide-react";
import {
  updateDisplayName,
  updateWorkspaceName,
  updateEmail,
  updatePassword,
  updateAvatar,
  removeAvatar,
} from "@/lib/actions/profile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

function initials(value: string): string {
  const base = value.split("@")[0] ?? value;
  const parts = base.split(/[.\-_\s]/).filter(Boolean);
  const chars = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (chars || base.slice(0, 2) || "?").toUpperCase();
}

type Feedback = { error?: string; message?: string } | null;

function Note({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  if (feedback.error)
    return <p className="text-sm text-red-600">{feedback.error}</p>;
  return (
    <p className="text-sm text-green-700">{feedback.message ?? "Salvo."}</p>
  );
}

function Card({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof UserRound;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <header className="flex items-center gap-2 border-b border-slate-200 bg-[#F3F4F6] px-4 py-2.5">
        <Icon className="h-4 w-4 text-slate-500" />
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      </header>
      <div className="space-y-3 p-4">
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {children}
      </div>
    </section>
  );
}

export function ProfileClient({
  email,
  fullName,
  avatarUrl,
  workspaceName,
  isAdmin,
}: {
  email: string;
  fullName: string;
  avatarUrl: string | null;
  workspaceName: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(fullName);
  const [wsName, setWsName] = useState(workspaceName);
  const [mail, setMail] = useState(email);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [busy, setBusy] = useState<string | null>(null);
  const [fb, setFb] = useState<Record<string, Feedback>>({});

  function setFeedback(key: string, value: Feedback) {
    setFb((prev) => ({ ...prev, [key]: value }));
  }

  async function run(
    key: string,
    action: (fd: FormData) => Promise<{ error?: string; message?: string }>,
    fields: Record<string, string>
  ) {
    setBusy(key);
    setFeedback(key, null);
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    const res = await action(fd);
    setBusy(null);
    setFeedback(key, res?.error ? { error: res.error } : { message: res?.message });
    if (!res?.error) router.refresh();
  }

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy("avatar");
    setFeedback("avatar", null);
    const fd = new FormData();
    fd.set("avatar", file);
    const res = await updateAvatar(fd);
    setBusy(null);
    setFeedback(
      "avatar",
      res?.error ? { error: res.error } : { message: "Foto atualizada." }
    );
    if (fileRef.current) fileRef.current.value = "";
    if (!res?.error) router.refresh();
  }

  async function onRemovePhoto() {
    setBusy("avatar");
    const res = await removeAvatar();
    setBusy(null);
    setFeedback(
      "avatar",
      res?.error ? { error: res.error } : { message: "Foto removida." }
    );
    if (!res?.error) router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* Foto */}
      <Card icon={Camera} title="Foto de perfil">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Sua foto"
              className="h-16 w-16 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#03A9F4] text-lg font-semibold text-white">
              {initials(fullName || email)}
            </span>
          )}

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onPickPhoto}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={busy === "avatar"}
              className="gap-1"
            >
              <Camera className="h-4 w-4" />
              {busy === "avatar" ? "Enviando..." : "Trocar foto"}
            </Button>
            {avatarUrl && (
              <Button
                variant="outline"
                onClick={onRemovePhoto}
                disabled={busy === "avatar"}
                className="gap-1 text-red-600"
              >
                <Trash2 className="h-4 w-4" /> Remover
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          JPG ou PNG, até 2 MB.
        </p>
        <Note feedback={fb.avatar} />
      </Card>

      {/* Nome */}
      <Card icon={UserRound} title="Seu nome">
        <div className="space-y-1.5">
          <Label>Nome de exibição</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como você quer ser chamado"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => run("name", updateDisplayName, { name })}
            disabled={busy === "name"}
          >
            {busy === "name" ? "Salvando..." : "Salvar nome"}
          </Button>
          <Note feedback={fb.name} />
        </div>
      </Card>

      {/* Workspace */}
      <Card
        icon={Building2}
        title="Workspace"
        description={
          isAdmin
            ? "Este nome aparece no topo do app e identifica a equipe."
            : "Apenas administradores podem renomear o workspace."
        }
      >
        <div className="space-y-1.5">
          <Label>Nome do workspace</Label>
          <Input
            value={wsName}
            onChange={(e) => setWsName(e.target.value)}
            disabled={!isAdmin}
          />
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3">
            <Button
              onClick={() =>
                run("ws", updateWorkspaceName, { workspace_name: wsName })
              }
              disabled={busy === "ws"}
            >
              {busy === "ws" ? "Salvando..." : "Salvar workspace"}
            </Button>
            <Note feedback={fb.ws} />
          </div>
        )}
      </Card>

      {/* E-mail */}
      <Card
        icon={Mail}
        title="E-mail"
        description="Ao trocar, enviamos um link de confirmação para o novo endereço. A mudança só vale depois de confirmar."
      >
        <div className="space-y-1.5">
          <Label>E-mail</Label>
          <Input
            type="email"
            value={mail}
            onChange={(e) => setMail(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => run("email", updateEmail, { email: mail })}
            disabled={busy === "email" || mail === email}
          >
            {busy === "email" ? "Enviando..." : "Alterar e-mail"}
          </Button>
          <Note feedback={fb.email} />
        </div>
      </Card>

      {/* Senha */}
      <Card icon={Lock} title="Senha">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nova senha</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Confirmar senha</Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repita a senha"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={async () => {
              await run("pwd", updatePassword, { password, confirm });
              setPassword("");
              setConfirm("");
            }}
            disabled={busy === "pwd" || !password}
          >
            {busy === "pwd" ? "Salvando..." : "Alterar senha"}
          </Button>
          <Note feedback={fb.pwd} />
        </div>
      </Card>
    </div>
  );
}
