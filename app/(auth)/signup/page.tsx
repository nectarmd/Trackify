import { AuthForm } from "@/components/auth/auth-form";
import { signUp } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return <AuthForm mode="signup" action={signUp} defaultEmail={email} />;
}
