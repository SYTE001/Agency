"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

export type TransitionPhase = "idle" | "expanding" | "navigating" | "revealing";

interface LoginTransitionContextValue {
  startTransitionToLogin: (buttonEl?: HTMLElement | null, targetUrl?: string) => void;
  isTransitioning: boolean;
  isFromTransition: boolean;
  phase: TransitionPhase;
}

const LoginTransitionContext = createContext<LoginTransitionContextValue>({
  startTransitionToLogin: () => {},
  isTransitioning: false,
  isFromTransition: false,
  phase: "idle",
});

export function useLoginTransition() {
  return useContext(LoginTransitionContext);
}

function getDiscMetrics(el: HTMLElement | null) {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  let x = Math.round(vw * 0.85);
  let y = 36;

  if (el && typeof el.getBoundingClientRect === "function") {
    const rect = el.getBoundingClientRect();
    x = rect.left + rect.width / 2;
    y = rect.top + rect.height / 2;
  }

  const dx = Math.max(x, vw - x);
  const dy = Math.max(y, vh - y);
  const radius = Math.hypot(dx, dy);
  const diameter = Math.ceil(radius * 2.2);

  return { x: Math.round(x), y: Math.round(y), diameter };
}

export function LoginTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [origin, setOrigin] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [discSize, setDiscSize] = useState<number>(2000);
  const [transitionTarget, setTransitionTarget] = useState<string | null>(null);

  const pathname = usePathname();
  const router = useRouter();

  // Derive isFromTransition without setting state in effects:
  // True as long as user is on /login and transition target was /login or /login?
  const isFromTransition =
    pathname === "/login" &&
    (transitionTarget === "/login" || (transitionTarget?.startsWith("/login?") ?? false));

  const isTransitioningRef = useRef(false);
  const activeButtonRef = useRef<HTMLElement | null>(null);
  const navigationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const cleanupClasses = useCallback(() => {
    if (typeof document !== "undefined") {
      document.body.classList.remove("login-nav-in-flight");
      if (activeButtonRef.current) {
        activeButtonRef.current.classList.remove("btn-masuk-pressed");
        activeButtonRef.current = null;
      }
    }
  }, []);

  const resetAll = useCallback(() => {
    isTransitioningRef.current = false;
    setPhase("idle");
    setTransitionTarget(null);
    cleanupClasses();
    if (navigationTimerRef.current) clearTimeout(navigationTimerRef.current);
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
  }, [cleanupClasses]);

  const startTransitionToLogin = useCallback(
    (buttonEl?: HTMLElement | null, targetUrl = "/login") => {
      // Guard against duplicate triggers or navigation while already transitioning or already on /login
      if (isTransitioningRef.current) return;
      if (pathname === "/login") return;

      // Accessibility: Respect prefers-reduced-motion
      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReduced) {
        router.push(targetUrl);
        return;
      }

      isTransitioningRef.current = true;
      setTransitionTarget(targetUrl);

      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("agy_from_transition", "1");
        } catch {}
      }

      // Scale interaction on the clicked button
      if (buttonEl) {
        buttonEl.classList.add("btn-masuk-pressed");
        activeButtonRef.current = buttonEl;
      }

      // Compute geometry for disc origin
      const metrics = getDiscMetrics(buttonEl ?? null);
      setOrigin({ x: metrics.x, y: metrics.y });
      setDiscSize(metrics.diameter);

      // Begin expansion and dim background
      if (typeof document !== "undefined") {
        document.body.classList.add("login-nav-in-flight");
      }
      setPhase("expanding");

      // Navigate to login destination at 180ms
      navigationTimerRef.current = setTimeout(() => {
        setPhase("navigating");
        router.push(targetUrl);
      }, 180);

      // Safety timeout: forcefully recover if navigation is interrupted or hangs
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = setTimeout(() => {
        if (isTransitioningRef.current) {
          resetAll();
        }
      }, 3000);
    },
    [pathname, resetAll, router]
  );

  // Arrived at /login destination
  useEffect(() => {
    if (pathname === "/login" && isTransitioningRef.current) {
      setPhase("revealing");
      cleanupClasses();

      const revealTimer = setTimeout(() => {
        setPhase("idle");
        isTransitioningRef.current = false;
      }, 340);

      return () => clearTimeout(revealTimer);
    }
  }, [pathname, cleanupClasses]);

  // Clean up session flag when outside /login
  useEffect(() => {
    if (pathname !== "/login") {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem("agy_from_transition");
        } catch {}
      }
    }
  }, [pathname]);

  // Handle browser back/forward (popstate) safely
  useEffect(() => {
    const handlePopState = () => {
      if (isTransitioningRef.current) {
        resetAll();
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [resetAll]);

  // Global click capture delegation for /login CTAs on public pages + router prefetch
  useEffect(() => {
    if (pathname === "/") {
      try {
        router.prefetch("/login");
      } catch {}
    }

    const handleClick = (e: MouseEvent) => {
      // Allow user modifier clicks (e.g., cmd+click, middle-click for new tab)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        return;
      }

      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      if (href === "/login" || href.startsWith("/login?") || href.endsWith("/login")) {
        e.preventDefault();
        startTransitionToLogin(anchor, href);
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, [pathname, router, startTransitionToLogin]);

  return (
    <LoginTransitionContext.Provider
      value={{
        startTransitionToLogin,
        isTransitioning: phase !== "idle",
        isFromTransition,
        phase,
      }}
    >
      {children}

      {phase !== "idle" && (
        <div
          className={`login-transition-root login-transition--${phase}`}
          style={{
            ["--origin-x" as string]: `${origin.x}px`,
            ["--origin-y" as string]: `${origin.y}px`,
            ["--disc-size" as string]: `${discSize}px`,
          }}
          aria-hidden="true"
        >
          <div className="login-transition-disc" />
          <div className="login-transition-curtain-left" />
          <div className="login-transition-curtain-right" />
        </div>
      )}
    </LoginTransitionContext.Provider>
  );
}
