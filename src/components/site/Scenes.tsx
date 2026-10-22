"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Dict } from "@/lib/i18n";
import { BookButton } from "./BookingContext";
import { IconArrow } from "../icons";

gsap.registerPlugin(ScrollTrigger);

function isStatic() {
  return document.documentElement.classList.contains("static");
}

/** Drives a CSS custom property (0→1) from the scroll position of a tall section */
function useScrollVar(ref: React.RefObject<HTMLElement | null>, name: string, onUpdate?: (p: number) => void) {
  useEffect(() => {
    const el = ref.current;
    if (!el || isStatic()) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        el.style.setProperty(name, self.progress.toFixed(4));
        onUpdate?.(self.progress);
      },
    });
    return () => st.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, name]);
}

/** Two images stacked; the clean one is revealed by a scroll-driven beam */
export function WashHero({ t }: { t: Dict }) {
  const ref = useRef<HTMLElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  useScrollVar(ref, "--p", (p) => {
    if (pct.current) pct.current.textContent = `${String(Math.round(Math.min(p / 0.78, 1) * 100)).padStart(3, "0")}%`;
  });
  return (
    <section className="wash" ref={ref} aria-labelledby="hero-title">
      <div className="wash-sticky">
        <div className="wash-media">
          <img
            src="/img/dirty-1920.webp"
            srcSet="/img/dirty-960.webp 960w, /img/dirty-1920.webp 1920w"
            sizes="100vw"
            alt=""
            fetchPriority="high"
          />
          <img
            className="wash-clean"
            src="/img/clean-1920.webp"
            srcSet="/img/clean-960.webp 960w, /img/clean-1920.webp 1920w"
            sizes="100vw"
            alt=""
            fetchPriority="high"
          />
          <div className="wash-beam" />
        </div>
        <div className="wash-shade" />
        <span className="wash-progress" ref={pct} aria-hidden>
          000%
        </span>
        <div className="wash-copy container">
          <div className="stack">
            <div className="wash-a" aria-hidden>
              <p className="display wash-title">
                {t.hero.a1} <span className="alt">{t.hero.a2}</span>
              </p>
            </div>
            <div className="wash-b">
              <h1 id="hero-title" className="display wash-title">
                <span className="sr-only">
                  {t.hero.a1} {t.hero.a2}{" "}
                </span>
                {t.hero.b1} <span className="alt">{t.hero.b2}</span>
              </h1>
              <div className="wash-b-row">
                <p className="lead">{t.hero.sub}</p>
                <div className="actions">
                  <BookButton>
                    {t.hero.cta} <IconArrow />
                  </BookButton>
                  <a className="btn btn-ghost" href="#services">
                    {t.hero.secondary}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="wash-hint" aria-hidden>
          <span className="mouse" />
          {t.hero.hint}
        </div>
      </div>
    </section>
  );
}

export function MacroScene({ t }: { t: Dict }) {
  const ref = useRef<HTMLElement>(null);
  useScrollVar(ref, "--m");
  return (
    <section className="macro" ref={ref} aria-labelledby="macro-title">
      <div className="macro-sticky">
        <div className="macro-media">
          <img src="/img/macro-1920.webp" srcSet="/img/macro-960.webp 960w, /img/macro-1920.webp 1920w" sizes="100vw" alt="" loading="lazy" />
        </div>
        <div className="container macro-copy">
          <div className="macro-a" aria-hidden>
            <p className="display macro-title">
              {t.macro.a1}
              <br />
              <span className="alt">{t.macro.a2}</span>
            </p>
          </div>
          <div className="macro-b">
            <h2 id="macro-title" className="display macro-title">
              {t.macro.b1}
              <br />
              <span className="alt">{t.macro.b2}</span>
            </h2>
            <p className="lead">{t.macro.body}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Reveal({ t }: { t: Dict }) {
  const ref = useRef<HTMLElement>(null);
  const img = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || !img.current || isStatic()) return;
    const tween = gsap.fromTo(
      img.current,
      { yPercent: -6, scale: 1.08 },
      { yPercent: 6, scale: 1, ease: "none", scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true } },
    );
    const title = ref.current.querySelectorAll(".reveal-line");
    const intro = gsap.from(title, {
      yPercent: 60,
      opacity: 0,
      stagger: 0.12,
      duration: 1,
      ease: "expo.out",
      scrollTrigger: { trigger: ref.current, start: "top 55%" },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      intro.scrollTrigger?.kill();
      intro.kill();
    };
  }, []);
  return (
    <section className="reveal" ref={ref} aria-labelledby="reveal-title">
      <div className="reveal-media" ref={img}>
        <img src="/img/golden-1920.webp" srcSet="/img/golden-960.webp 960w, /img/golden-1920.webp 1920w" sizes="100vw" alt="" loading="lazy" />
      </div>
      <div className="container reveal-copy">
        <h2 id="reveal-title" className="display gold reveal-title">
          <span className="reveal-line" style={{ display: "block" }}>
            {t.reveal.a1}
          </span>
          <span className="reveal-line alt" style={{ display: "block" }}>
            {t.reveal.a2}
          </span>
        </h2>
        <BookButton>
          {t.reveal.cta} <IconArrow />
        </BookButton>
      </div>
    </section>
  );
}

/** Fade-up for simple blocks */
export function FadeUp({ children, className, as: Tag = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "ul" | "ol" }) {
  const ref = useRef<HTMLDivElement & HTMLUListElement & HTMLOListElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || isStatic()) return;
    const items = el.children.length > 1 ? Array.from(el.children) : [el];
    const tw = gsap.from(items, {
      y: 30,
      opacity: 0,
      duration: 0.9,
      stagger: 0.08,
      ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
    return () => {
      tw.scrollTrigger?.kill();
      tw.kill();
    };
  }, []);
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
