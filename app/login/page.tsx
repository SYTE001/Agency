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

        <div className="mt-6 rounded-lg border bg-card/60 p-4 text-xs text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">Akun demo</p>
          <p>andi@kreatifnusantara.id · password123 (Owner)</p>
          <p>siti@kreatifnusantara.id · password123 (Account Manager)</p>
          <p>rina@kreatifnusantara.id · password123 (Finance)</p>
        </div>
      </div>
    </div>
  );
}
