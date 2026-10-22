"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/lib/config";
import { locales, type Dict, type Locale } from "@/lib/i18n";
import { BookButton } from "./BookingContext";
import { IconGlobe, IconMenu, IconX } from "../icons";

const LANG_NAMES: Record<Locale, string> = { he: "עברית", ar: "العربية", ru: "Русский", en: "English" };

export function Logo({ locale }: { locale: Locale }) {
  const [a, b] = siteConfig.brand.split(" ");
  return (
    <Link href={`/${locale}`} className="logo" aria-label={siteConfig.brand}>
      {a} <span>{b}</span>
    </Link>
  );
}

export function LangSwitch({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const rest = pathname.split("/").slice(2).join("/");
  return (
    <div className="lang-switch" ref={ref}>
      <button type="button" className="lang-btn" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)} aria-label={LANG_NAMES[locale]}>
        <IconGlobe style={{ width: 18, height: 18 }} />
        {locale}
      </button>
      {open && (
        <ul className="lang-menu">
          {locales.map((l) => (
            <li key={l}>
              <a href={`/${l}${rest ? `/${rest}` : ""}`} lang={l} aria-current={l === locale} hrefLang={l}>
                {LANG_NAMES[l]} <small>{l}</small>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Header({ locale, t }: { locale: Locale; t: Dict }) {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menu]);
  const links = [
    { href: "#services", label: t.nav.services },
    { href: "#process", label: t.nav.process },
    { href: "#contact", label: t.nav.contact },
  ];
  return (
    <>
      <header className={`site-header${scrolled || menu ? " scrolled" : ""}`}>
        <div className="container">
          <Logo locale={locale} />
          <nav className="nav-links" aria-label="Main">
            {links.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <LangSwitch locale={locale} />
            <BookButton className="btn btn-primary btn-sm header-book">{t.nav.book}</BookButton>
            <button type="button" className="menu-btn" aria-expanded={menu} aria-controls="mobile-nav" aria-label={menu ? t.nav.close : t.nav.menu} onClick={() => setMenu((m) => !m)}>
              {menu ? <IconX /> : <IconMenu />}
            </button>
          </div>
        </div>
      </header>
      {menu && (
        <nav id="mobile-nav" className="mobile-nav" aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMenu(false)}>
              {l.label}
            </a>
          ))}
          <span onClick={() => setMenu(false)}>
            <BookButton className="btn btn-primary">{t.nav.book}</BookButton>
          </span>
        </nav>
      )}
    </>
  );
}
