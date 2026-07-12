import { AuthForm } from "@/components/auth/auth-form";
import { signIn } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthForm
      mode="login"
      action={signIn}
      notice={
        params.registered
          ? "Conta criada! Faça login para continuar."
          : undefined
      }
    />
  );
}
