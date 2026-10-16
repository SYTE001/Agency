import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
import { getSafeRedirectUrl } from "@/lib/redirect";
import "./login.css";

export const metadata: Metadata = {
  title: "Masuk · Agency OS",
  description: "Agency OS — Agency Operating System. Masuk untuk melanjutkan ke workspace Anda.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LoginPage(props: {
  searchParams?: Promise<{ next?: string | string[] }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const rawNext = Array.isArray(searchParams.next) ? searchParams.next[0] : searchParams.next;
  const safeNext = getSafeRedirectUrl(rawNext, "/overview");

  const user = await getSessionUser();
  if (user) {
    redirect(safeNext);
  }

  return <LoginForm next={rawNext ? safeNext : undefined} />;
}
