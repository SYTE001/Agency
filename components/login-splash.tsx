"use client";

import { useEffect, useState } from "react";

interface LoginSplashProps {
  onExiting?: () => void;
  onComplete?: () => void;
}

export function LoginSplash({ onExiting, onComplete }: LoginSplashProps) {
  const [stage, setStage] = useState<"entering" | "exiting" | "hidden">("entering");

  useEffect(() => {
    // Kunci scrollbar dan samakan background body ke warna brand agar tidak ada celah putih
    document.documentElement.classList.add("splash-active");
    document.body.classList.add("splash-active");

    const holdTimer = setTimeout(() => {
      setStage("exiting");
      onExiting?.();
    }, 750);

    const finishTimer = setTimeout(() => {
      setStage("hidden");
      document.documentElement.classList.remove("splash-active");
      document.body.classList.remove("splash-active");
      onComplete?.();
    }, 1600);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(finishTimer);
      document.documentElement.classList.remove("splash-active");
      document.body.classList.remove("splash-active");
    };
  }, [onExiting, onComplete]);

  if (stage === "hidden") return null;

  const handleDismiss = () => {
    if (stage !== "entering") return;
    setStage("exiting");
    onExiting?.();
    setTimeout(() => {
      setStage("hidden");
      document.documentElement.classList.remove("splash-active");
      document.body.classList.remove("splash-active");
      onComplete?.();
    }, 850);
  };

  return (
    <aside
      className={`login-splash ${stage === "exiting" ? "login-splash--exit" : ""}`}
      onClick={handleDismiss}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
          handleDismiss();
        }
      }}
      tabIndex={0}
      role="status"
      aria-live="polite"
      aria-label="Memuat Agency OS"
    >
      <div className="login-splash-motifs" aria-hidden="true">
        <svg className="m-rings" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9.5" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2.6" />
        </svg>
        <span className="m-frame" />
      </div>

      <div className="login-splash-card">
        <div className="login-splash-badge" aria-hidden="true">
          AO
        </div>
        <h1 className="login-splash-title">Agency OS</h1>
        <p className="login-splash-sub">Agency Operating System</p>
        <div className="login-splash-track" aria-hidden="true">
          <div className="login-splash-bar" />
        </div>
      </div>

      <span className="login-splash-hint" aria-hidden="true">
        Klik di mana saja untuk melanjutkan
      </span>
    </aside>
  );
}
