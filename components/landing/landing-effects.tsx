"use client";

import { useEffect, useRef } from "react";

/**
 * Port of the redesign's vanilla interactions: scroll progress bar, back-to-top
 * button, scroll reveals, animated counters, GMV bar fills, decorative parallax
 * and 3D tilt. Everything is transform/opacity-only and skipped entirely when the
 * visitor prefers reduced motion.
 */
export function LandingEffects() {
  const barRef = useRef<HTMLSpanElement>(null);
  const toTopRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    const toTop = toTopRef.current;
    if (!bar || !toTop) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
      toTop.classList.toggle("is-on", y > 900);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const onToTop = () =>
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    toTop.addEventListener("click", onToTop);

    // Reveal on scroll
    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            revealObserver.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px" },
    );
    const revealEls = Array.from(document.querySelectorAll<HTMLElement>(".ttshq .reveal"));
    revealEls.forEach((el) => revealObserver.observe(el));

    // Counters
    const counterObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          counterObserver.unobserve(el);
          const target = Number.parseFloat(el.dataset.counter ?? "0");
          const decimals = Number.parseInt(el.dataset.decimals ?? "0", 10);
          const format = (n: number) =>
            n.toLocaleString("en-US", {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            });
          if (reduceMotion) {
            el.textContent = format(target);
            continue;
          }
          const duration = 1400;
          const start = performance.now();
          const step = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 4);
            el.textContent = format(target * eased);
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.6 },
    );
    const counters = Array.from(document.querySelectorAll<HTMLElement>(".ttshq [data-counter]"));
    counters.forEach((el) => counterObserver.observe(el));

    // GMV bar fills
    const fillObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          fillObserver.unobserve(el);
          requestAnimationFrame(() => {
            el.style.width = `${el.dataset.fill}%`;
          });
        }
      },
      { threshold: 0.5 },
    );
    const fills = Array.from(document.querySelectorAll<HTMLElement>(".ttshq .gmv-fill"));
    fills.forEach((el) => fillObserver.observe(el));

    // Decorative parallax (pointer-fine + motion-ok only)
    let rafId = 0;
    const cleanups: Array<() => void> = [];

    if (!reduceMotion) {
      const floats = Array.from(document.querySelectorAll<HTMLElement>(".ttshq .paper"));
      if (floats.length > 0) {
        let mx = 0;
        let my = 0;
        let tmx = 0;
        let tmy = 0;

        if (window.matchMedia("(pointer: fine)").matches) {
          const onMove = (e: MouseEvent) => {
            tmx = (e.clientX / window.innerWidth - 0.5) * 2;
            tmy = (e.clientY / window.innerHeight - 0.5) * 2;
          };
          window.addEventListener("mousemove", onMove, { passive: true });
          cleanups.push(() => window.removeEventListener("mousemove", onMove));
        }

        let zoneVisible = true;
        const zoneObserver = new IntersectionObserver(
          (es) => es.forEach((en) => { zoneVisible = en.isIntersecting; }),
          { rootMargin: "140px" },
        );
        const firstZone = floats[0]?.closest("section");
        if (firstZone) zoneObserver.observe(firstZone);
        cleanups.push(() => zoneObserver.disconnect());

        const t0 = performance.now();
        const tick = (now: number) => {
          if (zoneVisible) {
            const t = (now - t0) / 1000;
            mx += (tmx - mx) * 0.06;
            my += (tmy - my) * 0.06;
            floats.forEach((el, i) => {
              const speed = Number.parseFloat(el.dataset.parallax ?? "0.2");
              const fx = Math.cos(t * 0.4 + i * 2.1) * 9;
              const fy = Math.sin(t * 0.55 + i * 1.7) * 12;
              el.style.translate = `${(fx + mx * 46 * speed).toFixed(1)}px ${(fy + my * 34 * speed).toFixed(1)}px`;
            });
          }
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
      }

      // 3D tilt on pointer-fine devices
      if (window.matchMedia("(pointer: fine)").matches) {
        for (const card of document.querySelectorAll<HTMLElement>(".ttshq [data-tilt]")) {
          const onEnter = () => {
            card.style.transition = "transform .18s ease-out";
          };
          const onMove = (e: MouseEvent) => {
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            card.style.transform =
              `perspective(900px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 7).toFixed(2)}deg) translateY(-4px)`;
          };
          const onLeave = () => {
            card.style.transition = "transform .7s cubic-bezier(.22,1.28,.32,1)";
            card.style.transform = "";
          };
          card.addEventListener("mouseenter", onEnter);
          card.addEventListener("mousemove", onMove);
          card.addEventListener("mouseleave", onLeave);
          cleanups.push(() => {
            card.removeEventListener("mouseenter", onEnter);
            card.removeEventListener("mousemove", onMove);
            card.removeEventListener("mouseleave", onLeave);
          });
        }
      }
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      toTop.removeEventListener("click", onToTop);
      revealObserver.disconnect();
      counterObserver.disconnect();
      fillObserver.disconnect();
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return (
    <>
      <div className="scroll-progress" aria-hidden="true">
        <span ref={barRef} />
      </div>

      <button type="button" className="to-top" ref={toTopRef} aria-label="Back to top">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M12 19V5m-6 6 6-6 6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </>
  );
}
