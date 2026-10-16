"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { login, type LoginState } from "@/app/actions/auth";
import { useTheme } from "@/components/theme-provider";
import { LoginSplash } from "@/components/login-splash";
import { useLoginTransition } from "@/components/login-transition-provider";

const initialState: LoginState = {};

type ModalType = "google" | "microsoft" | "forgot" | "invite" | "help" | "privacy" | null;

export function LoginForm({ next }: { next?: string } = {}) {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const { toggle } = useTheme();
  const { isFromTransition } = useLoginTransition();

  // Permanently remember if this mount originated from the homepage transition
  const [fromTransition] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return sessionStorage.getItem("agy_from_transition") === "1";
      } catch {}
    }
    return false;
  });

  const skipSplash = isFromTransition || fromTransition;

  useEffect(() => {
    if (fromTransition && typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("agy_from_transition");
      } catch {}
    }
  }, [fromTransition]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Clear errors on input
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) setEmailError("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) setPasswordError("");
  };

  // Caps lock detection
  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isCaps = typeof e.getModifierState === "function" && e.getModifierState("CapsLock");
    setCapsLockActive(Boolean(isCaps));
  };

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeModal) {
        setActiveModal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModal]);

  // Client validation before submitting server action
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setEmailError("");
    setPasswordError("");

    let valid = true;
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedEmail)) {
      setEmailError("Masukkan alamat email kantor yang valid.");
      valid = false;
      emailInputRef.current?.focus();
    } else if (!password || password.length < 8) {
      setPasswordError("Password minimal 8 karakter.");
      valid = false;
      passwordInputRef.current?.focus();
    }

    if (!valid) {
      e.preventDefault();
    }
  };

  const shellClass = [
    "login-shell",
    isRevealed || skipSplash ? "login-shell--revealed" : "",
    skipSplash ? "login-shell--from-transition" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className={shellClass}>
      {!skipSplash && <LoginSplash onExiting={() => setIsRevealed(true)} />}

      {/* ================= LEFT · BRAND PANEL (NAVY SOLID) ================= */}
      <section className="brand-panel" aria-label="Tentang Agency OS">
        {/* Background decorative motifs */}
        <div className="motifs" aria-hidden="true">
          <div className="motif-row top">
            <span className="tile">
              <svg viewBox="0 0 24 24">
                <rect x="2.5" y="6" width="13" height="12" rx="2.5" />
                <path d="M15.5 10.8 21.5 7v10l-6-3.8" />
              </svg>
            </span>
            <span className="tile">
              <svg viewBox="0 0 24 24">
                <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
                <path d="M3.5 10h17M8 3v4M16 3v4M8 14h3" />
              </svg>
            </span>
            <span className="tile">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="7.5" width="18" height="12" rx="2.5" />
                <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3 13h18" />
              </svg>
            </span>
            <span className="tile">
              <svg viewBox="0 0 24 24">
                <path d="M20.5 12a7.5 7.5 0 0 1-7.5 7.5H8.4L4 23v-4.6A7.5 7.5 0 0 1 5.5 4.5h7.5A7.5 7.5 0 0 1 20.5 12Z" />
                <circle className="solid" cx="9" cy="12" r="1" />
                <circle className="solid" cx="12.5" cy="12" r="1" />
                <circle className="solid" cx="16" cy="12" r="1" />
              </svg>
            </span>
            <span className="tile">
              <svg viewBox="0 0 24 24">
                <path d="M6 3.5h12v17l-3-2-3 2-3-2-3 2z" />
                <path d="M9.5 8.5h5M9.5 12.5h5" />
              </svg>
            </span>
            <span className="tile">
              <svg viewBox="0 0 24 24">
                <path d="M4 10v4h3l4.5 4V6L7 10H4Z" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7" />
              </svg>
            </span>
          </div>

          <div className="motif-row bottom">
            <span className="tile">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 7v5.3l3.2 2" />
              </svg>
            </span>
            <span className="tile">
              <svg viewBox="0 0 24 24">
                <path d="M3.5 20.5h17" />
                <path d="M7 20.5V13M12 20.5V6.5M17 20.5v-5" />
              </svg>
            </span>
            <span className="tile">
              <svg viewBox="0 0 24 24">
                <path d="M9.5 18h5M10.5 21h3" />
                <path d="M12 3a6 6 0 0 1 3.6 10.8V18H8.4v-4.2A6 6 0 0 1 12 3Z" />
              </svg>
            </span>
            <span className="tile">
              <svg viewBox="0 0 24 24">
                <path d="M4 20.2l4.3-.9L19 8.6a2.1 2.1 0 0 0-3-3L5.3 16.2 4 20.2Z" />
                <path d="M14.8 6.8l2.9 2.9" />
              </svg>
            </span>
            <span className="tile">
              <svg viewBox="0 0 24 24">
                <path d="m12 3 9 4.5-9 4.5-9-4.5Z" />
                <path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5" />
              </svg>
            </span>
            <span className="tile">
              <svg viewBox="0 0 24 24">
                <circle cx="10" cy="8" r="3.5" />
                <path d="M4 20.5a6 6 0 0 1 11-3.4" />
                <path d="m16.5 16.5 2 2 3.5-3.5" />
              </svg>
            </span>
          </div>

          <span className="m-frame" />
          <svg className="m-rings" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9.5" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2.6" />
          </svg>
        </div>

        <header className="mark">
          <span className="mark-badge" aria-hidden="true">
            AO
          </span>
          <span>
            <span className="mark-name" style={{ display: "block" }}>
              Agency OS
            </span>
            <span className="mark-sub">Operating System</span>
          </span>
        </header>

        <div className="hero">
          <span className="slogan-kicker" aria-hidden="true" />
          <h1 className="slogan">
            <span className="line">
              Jalankan agency{" "}
              <span className="nb">
                kamu
                {/* sticker: roket */}
                <svg className="emoji" viewBox="0 0 32 32" aria-hidden="true">
                  <path
                    d="M16 31.9c-1.5-1.5-2.4-3.3-2.4-5.1v-3.6h4.8v3.6c0 1.8-.9 3.6-2.4 5.1Z"
                    fill="#cfe0ff"
                  />
                  <path
                    d="M16 29.4c-.7-.9-1.1-2-1.1-3.1v-2.4h2.2v2.4c0 1.1-.4 2.2-1.1 3.1Z"
                    fill="#ffffff"
                  />
                  <path d="M10.4 16.4 6 22.2v4.3c0 .8.9 1.2 1.5.7l2.9-2.5Z" fill="#cfe0ff" />
                  <path d="M21.6 16.4 26 22.2v4.3c0 .8-.9 1.2-1.5.7l-2.9-2.5Z" fill="#cfe0ff" />
                  <path
                    d="M16 2.2c3.6 3.4 5.6 7.7 5.6 12.2v7.4c0 .9-.7 1.6-1.6 1.6h-8c-.9 0-1.6-.7-1.6-1.6v-7.4c0-4.5 2-8.8 5.6-12.2Z"
                    fill="#ffffff"
                  />
                  <circle cx="16" cy="12.6" r="3.4" fill="#10367d" />
                  <circle cx="14.8" cy="11.4" r="1" fill="#ffffff" />
                </svg>
              </span>
            </span>
            <span className="line">
              <span className="dim nb">dari satu</span> <span className="hl">workspace</span>
              {/* sticker: petir */}
              <svg className="emoji tilt-r" viewBox="0 0 32 32" aria-hidden="true">
                <path
                  d="M19.4 1.6 7.2 18.4h5.9l-1.1 12 12.4-17.2h-6.3Z"
                  fill="#cfe0ff"
                  stroke="#cfe0ff"
                  strokeWidth="1.5"
                  strokeLinejoin="miter"
                />
              </svg>
            </span>
          </h1>

          <div className="proof">
            <div className="avatars" aria-hidden="true">
              <span>RS</span>
              <span>DP</span>
              <span>NA</span>
              <span>+</span>
            </div>
            <div className="proof-text">
              Dipercaya <b>120+ agency &amp; studio</b> di Indonesia
            </div>
          </div>
        </div>

        <footer className="brand-foot">
          <span>© 2026 Agency OS</span>
          <span>
            <button type="button" onClick={() => setActiveModal("help")}>
              Bantuan
            </button>{" "}
            ·{" "}
            <button type="button" onClick={() => setActiveModal("help")}>
              Status
            </button>{" "}
            ·{" "}
            <button type="button" onClick={() => setActiveModal("privacy")}>
              Privacy
            </button>
          </span>
        </footer>
      </section>

      {/* ================= RIGHT · FORM PANEL ================= */}
      <section className="form-panel">
        <button
          className="theme-toggle"
          id="themeToggle"
          type="button"
          aria-label="Ganti tema terang / gelap"
          title="Ganti tema"
          onClick={toggle}
        >
          <svg
            className="i-sun"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4 5.2 18.8" />
          </svg>
          <svg
            className="i-moon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.8 6.8 0 0 0 9.8 9.8Z" />
          </svg>
        </button>

        <div className="form-wrap">
          <div className="form-brand">
            <span className="mark-badge" aria-hidden="true">
              AO
            </span>
            <span>
              <span className="mark-name" style={{ display: "block" }}>
                Agency OS
              </span>
              <span className="mark-sub">Operating System</span>
            </span>
          </div>

          <div className="form-head">
            <h2>Selamat datang kembali</h2>
            <p>
              Masuk untuk melanjutkan ke workspace <strong>Kreatif Nusantara</strong>.
            </p>
          </div>

          <form action={formAction} onSubmit={handleFormSubmit} className="card" noValidate>
            <input type="hidden" name="next" value={next || ""} />
            {/* Email Field */}
            <div className="field">
              <label htmlFor="email">Email kantor</label>
              <div
                className={`control ${emailError ? "invalid" : ""}`}
                id="emailControl"
              >
                <svg
                  className="lead"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
                  <path d="m3 7.5 8.1 5.6a1.6 1.6 0 0 0 1.8 0L21 7.5" />
                </svg>
                <input
                  ref={emailInputRef}
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="nama@agency.co.id"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  aria-describedby={emailError ? "emailHint" : undefined}
                />
              </div>
              {emailError && (
                <p className="hint err" id="emailHint" role="alert">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7.6v5.2M12 16.4h.01" />
                  </svg>
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="field">
              <label htmlFor="password">Password</label>
              <div
                className={`control has-suffix ${
                  passwordError || state?.error ? "invalid" : ""
                }`}
                id="passwordControl"
              >
                <svg
                  className="lead"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3.5" y="10.5" width="17" height="10" rx="2.5" />
                  <path d="M7.5 10.5V7.8a4.5 4.5 0 0 1 9 0v2.7" />
                  <path d="M12 14.6v2.2" />
                </svg>
                <input
                  ref={passwordInputRef}
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  value={password}
                  onChange={handlePasswordChange}
                  onKeyDown={handlePasswordKeyDown}
                  onKeyUp={handlePasswordKeyDown}
                  onBlur={() => setCapsLockActive(false)}
                  required
                  aria-describedby={
                    passwordError || state?.error || capsLockActive ? "passwordHint" : undefined
                  }
                />
                <button
                  className="ghost-btn"
                  id="togglePassword"
                  type="button"
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <svg
                      className="i-eye-off"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9.9 5.2A9.6 9.6 0 0 1 12 5c6.2 0 9.8 7 9.8 7a17 17 0 0 1-2.6 3.6M6.4 6.9A17 17 0 0 0 2.2 12S5.8 19 12 19a9.7 9.7 0 0 0 4.3-1" />
                      <path d="M10 10.1a3 3 0 0 0 4.2 4.2" />
                      <path d="m3 3 18 18" />
                    </svg>
                  ) : (
                    <svg
                      className="i-eye"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2.2 12S5.8 5.8 12 5.8 21.8 12 21.8 12 18.2 18.2 12 18.2 2.2 12 2.2 12Z" />
                      <circle cx="12" cy="12" r="3.1" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password hints */}
              {passwordError && (
                <p className="hint err" id="passwordHint" role="alert">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7.6v5.2M12 16.4h.01" />
                  </svg>
                  <span>{passwordError}</span>
                </p>
              )}

              {capsLockActive && !passwordError && (
                <p className="hint warn" id="passwordHint">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7.6v5.2M12 16.4h.01" />
                  </svg>
                  <span>Caps Lock sedang aktif.</span>
                </p>
              )}

              {state?.error && !passwordError && (
                <p className="hint err" role="alert">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7.6v5.2M12 16.4h.01" />
                  </svg>
                  <span>{state.error}</span>
                </p>
              )}
            </div>

            <div className="row">
              <label className="check">
                <input type="checkbox" id="remember" name="remember" defaultChecked />
                <span className="box" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m5 12.8 4.4 4.4L19 7" />
                  </svg>
                </span>
                <span>Ingat saya</span>
              </label>
              <button
                type="button"
                className="link"
                id="forgotLink"
                onClick={() => setActiveModal("forgot")}
              >
                Lupa password?
              </button>
            </div>

            <button
              className={`btn-primary ${isPending ? "loading" : ""}`}
              id="submitBtn"
              type="submit"
              disabled={isPending}
            >
              {isPending && <span className="spinner" aria-hidden="true" />}
              <span className="btn-label">{isPending ? "Memverifikasi…" : "Masuk"}</span>
              {!isPending && (
                <svg
                  className="arrow"
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h13M13 6.5 18.5 12 13 17.5" />
                </svg>
              )}
            </button>

            <div className="divider" role="separator">
              atau lanjutkan dengan
            </div>

            {/* SSO buttons with Pop-up Coming Soon */}
            <div className="sso">
              <button
                className="btn-sso"
                type="button"
                onClick={() => setActiveModal("google")}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1a7 7 0 0 1-6.6-4.8H1.4v3.1A12 12 0 0 0 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.5-3.5A12 12 0 0 0 1.4 6.7l4 3.1A7 7 0 0 1 12 4.8Z"
                  />
                </svg>
                <span>Google</span>
              </button>
              <button
                className="btn-sso"
                type="button"
                onClick={() => setActiveModal("microsoft")}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#F25022" d="M3 3h8.4v8.4H3z" />
                  <path fill="#7FBA00" d="M12.6 3H21v8.4h-8.4z" />
                  <path fill="#00A4EF" d="M3 12.6h8.4V21H3z" />
                  <path fill="#FFB900" d="M12.6 12.6H21V21h-8.4z" />
                </svg>
                <span>Microsoft</span>
              </button>
            </div>

            <p className="secure">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
                <path d="M8 10.5V7.6a4 4 0 0 1 8 0v2.9" />
              </svg>
              Koneksi terenkripsi AES-256 · SSO siap pakai
            </p>
          </form>

          <p className="form-foot">
            Belum punya akses?{" "}
            <button
              type="button"
              className="link"
              onClick={() => setActiveModal("invite")}
            >
              Minta undangan ke admin
            </button>
          </p>

          <p className="legal">
            Dengan masuk, Anda menyetujui{" "}
            <button type="button" onClick={() => setActiveModal("privacy")}>
              Syarat Layanan
            </button>{" "}
            dan{" "}
            <button type="button" onClick={() => setActiveModal("privacy")}>
              Kebijakan Privasi
            </button>{" "}
            Agency OS.
          </p>
        </div>
      </section>

      {/* ================= MODAL / POP-UP (NO DUMMIES) ================= */}
      {activeModal && (
        <div
          className="login-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="login-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="login-modal-head">
              <span className="login-modal-badge">
                {activeModal === "google" || activeModal === "microsoft"
                  ? "Segera Hadir"
                  : activeModal === "forgot"
                    ? "Bantuan Akses"
                    : activeModal === "invite"
                      ? "Undangan Agensi"
                      : "Informasi Resmi"}
              </span>
              <button
                type="button"
                className="login-modal-close"
                onClick={() => setActiveModal(null)}
                aria-label="Tutup modal"
              >
                ✕
              </button>
            </div>

            <div className="login-modal-icon-wrap">
              {activeModal === "google" && (
                <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1a7 7 0 0 1-6.6-4.8H1.4v3.1A12 12 0 0 0 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.5-3.5A12 12 0 0 0 1.4 6.7l4 3.1A7 7 0 0 1 12 4.8Z"
                  />
                </svg>
              )}
              {activeModal === "microsoft" && (
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#F25022" d="M3 3h8.4v8.4H3z" />
                  <path fill="#7FBA00" d="M12.6 3H21v8.4h-8.4z" />
                  <path fill="#00A4EF" d="M3 12.6h8.4V21H3z" />
                  <path fill="#FFB900" d="M12.6 12.6H21V21h-8.4z" />
                </svg>
              )}
              {(activeModal === "forgot" || activeModal === "invite" || activeModal === "help" || activeModal === "privacy") && (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: "var(--accent)" }}
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              )}
            </div>

            {activeModal === "google" && (
              <>
                <h3>Masuk dengan Google Workspace</h3>
                <p>
                  Integrasi Single Sign-On (SSO) Google Workspace sedang dalam tahap finalisasi
                  verifikasi domain OAuth 2.0. Saat ini silakan masuk menggunakan kredensial Email
                  kantor dan Password agensi Anda.
                </p>
              </>
            )}

            {activeModal === "microsoft" && (
              <>
                <h3>Masuk dengan Microsoft Entra ID</h3>
                <p>
                  Dukungan autentikasi terpusat Microsoft Entra ID (Azure AD) untuk multi-tenant
                  enterprise sedang dalam tahap integrasi. Silakan masuk menggunakan Email dan
                  Password akun agensi yang telah terdaftar.
                </p>
              </>
            )}

            {activeModal === "forgot" && (
              <>
                <h3>Reset Kata Sandi Akun Agensi</h3>
                <p>
                  Demi keamanan data multi-tenant dan isolasi hak akses, pengaturan ulang kata sandi
                  dikelola secara terpusat oleh Super Administrator atau Owner agensi Anda. Silakan
                  hubungi administrator agensi Anda untuk menerbitkan sandi sementara.
                </p>
              </>
            )}

            {activeModal === "invite" && (
              <>
                <h3>Permintaan Akses Workspace</h3>
                <p>
                  Agency OS beroperasi berbasis sistem undangan tertutup per agensi. Akun pengguna baru
                  hanya dapat dibuat oleh Owner atau Admin agensi melalui menu <em>Pengaturan Pengguna</em>.
                  Hubungi koordinator tim atau Administrator agensi Anda untuk mendapatkan akses.
                </p>
              </>
            )}

            {activeModal === "help" && (
              <>
                <h3>Pusat Bantuan &amp; Status Sistem</h3>
                <p>
                  Seluruh layanan core engine (Master Data, Pipeline Kampanye, Jadwal LIVE Streaming,
                  dan Settlement Finansial) beroperasi secara normal. Jika Anda mengalami kendala akses,
                  hubungi tim teknis agensi Anda atau tim pengelola Agency OS.
                </p>
              </>
            )}

            {activeModal === "privacy" && (
              <>
                <h3>Privasi &amp; Keamanan Data</h3>
                <p>
                  Agency OS menerapkan isolasi data multi-tenant tingkat database, proteksi hashing
                  scrypt berstandar enterprise, session token aman terenkripsi (HS256), serta kontrol
                  hak akses berbasis peran (RBAC) yang ketat.
                </p>
              </>
            )}

            <div className="login-modal-foot">
              <button
                type="button"
                className="login-modal-btn"
                onClick={() => {
                  setActiveModal(null);
                  if (activeModal === "google" || activeModal === "microsoft") {
                    emailInputRef.current?.focus();
                  }
                }}
              >
                {activeModal === "google" || activeModal === "microsoft"
                  ? "Masuk dengan Email"
                  : "Mengerti"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
