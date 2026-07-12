"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Action = (
  prev: { error?: string } | undefined,
  formData: FormData
) => Promise<{ error?: string }>;

export function AuthForm({
  mode,
  action,
  notice,
  defaultEmail,
}: {
  mode: "login" | "signup";
  action: Action;
  notice?: string;
  /** Pré-preenche o e-mail (convite): se digitar outro, o convite não pega. */
  defaultEmail?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const isLogin = mode === "login";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#212A3A] p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#03A9F4] text-white">
            <Clock className="h-5 w-5" />
          </div>
          <span className="text-2xl font-bold text-[#212A3A]">Trackify</span>
        </div>

        <h1 className="mb-1 text-center text-lg font-semibold">
          {isLogin ? "Entrar na sua conta" : "Criar conta"}
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          {isLogin
            ? "Bem-vindo de volta! Rastreie seu tempo."
            : "Comece a rastrear seu tempo agora."}
        </p>

        {notice && (
          <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            {notice}
          </p>
        )}

        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              defaultValue={defaultEmail}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder="••••••••"
              required
            />
          </div>

          {state?.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {state.error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending
              ? "Aguarde..."
              : isLogin
                ? "Entrar"
                : "Criar conta"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isLogin ? (
            <>
              Não tem conta?{" "}
              <Link href="/signup" className="font-medium text-[#03A9F4]">
                Cadastre-se
              </Link>
            </>
          ) : (
            <>
              Já tem conta?{" "}
              <Link href="/login" className="font-medium text-[#03A9F4]">
                Entrar
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
