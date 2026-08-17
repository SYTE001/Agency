import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Masuk — Agency OS" };

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-subtle px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-lg font-bold text-brand-foreground">
            KN
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Kreatif Nusantara</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Agency Operating System — masuk untuk melanjutkan.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
