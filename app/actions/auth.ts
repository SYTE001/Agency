"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import {
  createSessionToken,
  verifyPassword,
  SESSION_COOKIE,
} from "@/lib/auth";
import { getSafeRedirectUrl } from "@/lib/redirect";

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = formData.get("next");

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  let user;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch (err) {
    console.error("Login database error:", err);
    return { error: "Layanan autentikasi sedang mengalami gangguan. Coba beberapa saat lagi." };
  }

  if (!user) return { error: "Email atau password salah." };

  let ok = false;
  try {
    ok = await verifyPassword(password, user.passwordHash);
  } catch (err) {
    console.error("Password verification error:", err);
    return { error: "Email atau password salah." };
  }
  if (!ok) return { error: "Email atau password salah." };

  let token: string;
  try {
    token = await createSessionToken(user);
  } catch (err) {
    console.error("Token creation error:", err);
    return { error: "Gagal membuat sesi login. Coba beberapa saat lagi." };
  }

  const cookieStore = await cookies();
  const remember = formData.get("remember");
  // Default checked: 7 days. If explicitly unchecked: session cookie (no maxAge)
  const maxAge = remember === "off" || remember === "false" ? undefined : 60 * 60 * 24 * 7;

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(maxAge ? { maxAge } : {}),
  });

  const destination = getSafeRedirectUrl(typeof next === "string" ? next : null, "/overview");
  redirect(destination);
}

export async function logout(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    cookieStore.delete(SESSION_COOKIE);
  } catch (err) {
    console.error("Logout error:", err);
  }

  revalidatePath("/", "layout");
  redirect("/");
}
