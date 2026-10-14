import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
import "./login.css";

export const metadata: Metadata = {
  title: "Masuk · Agency OS",
  description: "Agency OS — Agency Operating System. Masuk untuk melanjutkan ke workspace Anda.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/overview");

  return <LoginForm />;
}
