import { AuthForm } from "@/components/auth/auth-form";
import { signUp } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return <AuthForm mode="signup" action={signUp} />;
}
