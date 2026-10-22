"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/lib/config";
import type { Dict, Locale } from "@/lib/i18n";
import { waLink } from "@/lib/whatsapp";
import { BookButton } from "./BookingContext";
import { IconA11y, IconWhatsApp, IconX } from "../icons";

type Prefs = { text?: boolean; contrast?: boolean; motion?: boolean; links?: boolean };
const KEY = "ng.a11y";

function apply(p: Prefs) {
  const d = document.documentElement;
  (["text", "contrast", "motion", "links"] as const).forEach((k) => d.classList.toggle(`a11y-${k}`, !!p[k]));
}

export function A11yWidget({ locale, t }: { locale: Locale; t: Dict }) {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({});
  useEffect(() => {
    try {
      setPrefs(JSON.parse(localStorage.getItem(KEY) || "{}"));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  const update = (p: Prefs) => {
    setPrefs(p);
    apply(p);
    try {
      localStorage.setItem(KEY, JSON.stringify(p));
    } catch {
      /* ignore */
    }
    // scroll scenes only switch mode on reload
    if (p.motion !== prefs.motion) window.location.reload();
  };
  const items: { k: keyof Prefs; label: string }[] = [
    { k: "text", label: t.a11y.bigger },
    { k: "contrast", label: t.a11y.contrast },
    { k: "motion", label: t.a11y.motion },
    { k: "links", label: t.a11y.links },
  ];
  return (
    <>
      <button type="button" className="fab fab-a11y" aria-label={t.a11y.open} aria-expanded={open} aria-controls="a11y-panel" onClick={() => setOpen((o) => !o)}>
        <IconA11y />
      </button>
      {open && (
        <div id="a11y-panel" className="a11y-panel" role="dialog" aria-label={t.a11y.title}>
          <h2>
            {t.a11y.title}
            <button type="button" className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => setOpen(false)} aria-label={t.nav.close}>
              <IconX style={{ width: 18, height: 18 }} />
            </button>
          </h2>
          {items.map((i) => (
            <button key={i.k} type="button" className="toggle" aria-pressed={!!prefs[i.k]} onClick={() => update({ ...prefs, [i.k]: !prefs[i.k] })}>
              {i.label}
              <span aria-hidden>{prefs[i.k] ? "●" : "○"}</span>
            </button>
          ))}
          <button type="button" className="toggle" onClick={() => update({})}>
            {t.a11y.reset}
          </button>
          <a href={`/${locale}/accessibility`}>{t.a11y.statement}</a>
        </div>
      )}
    </>
  );
}

export default function Floating({ locale, t }: { locale: Locale; t: Dict }) {
  return (
    <>
      <BookButton className="btn btn-primary mobile-book">{t.nav.book}</BookButton>
      <div className="fab-stack">
        <A11yWidget locale={locale} t={t} />
        <a className="fab fab-wa" href={waLink(siteConfig.phone, "")} target="_blank" rel="noopener noreferrer" aria-label={t.whatsappFab}>
          <IconWhatsApp />
        </a>
      </div>
    </>
  );
}
