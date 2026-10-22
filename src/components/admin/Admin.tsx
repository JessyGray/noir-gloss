"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { siteConfig, type ServiceId, type VehicleId } from "@/lib/config";
import {
  STATUSES,
  dateKey,
  formatPhone,
  fromMinutes,
  hoursFor,
  normalizeIlPhone,
  parseDateKey,
  quote,
  toMinutes,
  type Booking,
  type BookingSource,
  type BookingStatus,
} from "@/lib/booking";
import { formatPrice, getDict, type Locale } from "@/lib/i18n";
import { getAdminDict, type AdminDict } from "@/lib/i18n/admin";
import { DEMO_PASSWORD, defaultSettings, getStore, type Settings } from "@/lib/store";
import { PROVIDERS } from "@/lib/payments";
import { confirmMessage, formatDay, waLink } from "@/lib/whatsapp";
import { LangSwitch, Logo } from "../site/Header";
import { IconDownload, IconEdit, IconLogout, IconPhone, IconPlus, IconSearch, IconTrash, IconWhatsApp, IconX } from "../icons";

type Tab = "leads" | "schedule" | "settings";
type Editing = { mode: "edit"; booking: Booking } | { mode: "new" } | { mode: "block" } | null;

const SOURCES: BookingSource[] = ["website", "phone", "walk_in", "whatsapp", "instagram"];
const ACTIVE = (b: Booking) => b.status !== "cancelled" && b.status !== "no_show";

export default function Admin({ locale }: { locale: Locale }) {
  const a = getAdminDict(locale);
  const t = getDict(locale);
  const store = getStore();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("leads");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings(siteConfig.phone));
  const [editing, setEditing] = useState<Editing>(null);

  const reload = useCallback(async () => {
    const [list, s] = await Promise.all([store.list(), store.getSettings()]);
    setBookings(list);
    if (s) setSettings(s);
  }, [store]);

  useEffect(() => {
    store.isSignedIn().then((ok) => {
      setAuthed(ok);
      if (ok) reload();
    });
  }, [store, reload]);

  if (authed === null) return <div className="adm-loading" aria-busy="true" />;
  if (!authed)
    return (
      <Login
        a={a}
        locale={locale}
        demo={store.mode === "demo"}
        onLogin={async (email, pw) => {
          const ok = await store.signIn(email, pw);
          if (ok) {
            setAuthed(true);
            reload();
          }
          return ok;
        }}
      />
    );

  const save = async (b: Partial<Booking> & { id?: string }) => {
    if (b.id) await store.update(b.id, b);
    else await store.create(b as Booking);
    setEditing(null);
    reload();
  };

  return (
    <div className="adm">
      <header className="adm-top">
        <div className="adm-top-row">
          <Logo locale={locale} />
          <span className="adm-title">{a.title}</span>
          <div className="adm-top-actions">
            <LangSwitch locale={locale} />
            <a className="btn btn-ghost btn-sm adm-hide-sm" href={`/${locale}`}>
              {a.backToSite}
            </a>
            <button
              type="button"
              className="icon-btn"
              aria-label={a.logout}
              onClick={async () => {
                await store.signOut();
                setAuthed(false);
              }}
            >
              <IconLogout />
            </button>
          </div>
        </div>
        <div className="adm-top-row">
          <nav className="seg" role="tablist" aria-label={a.title}>
            {(["leads", "schedule", "settings"] as Tab[]).map((k) => (
              <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)}>
                {a.tabs[k]}
                {k === "leads" && bookings.filter((b) => b.status === "new").length > 0 && (
                  <span className="dot">{bookings.filter((b) => b.status === "new").length}</span>
                )}
              </button>
            ))}
          </nav>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing({ mode: "new" })}>
            <IconPlus style={{ width: 18, height: 18 }} /> {a.newBooking}
          </button>
        </div>
      </header>

      <main className="adm-main">
        {tab === "leads" && (
          <Leads
            a={a}
            locale={locale}
            bookings={bookings}
            onStatus={async (id, status) => {
              await store.update(id, { status });
              reload();
            }}
            onEdit={(booking) => setEditing({ mode: "edit", booking })}
            onDelete={async (id) => {
              await store.remove(id);
              reload();
            }}
          />
        )}
        {tab === "schedule" && (
          <Schedule a={a} locale={locale} bookings={bookings} onEdit={(booking) => setEditing({ mode: "edit", booking })} onBlock={() => setEditing({ mode: "block" })} />
        )}
        {tab === "settings" && (
          <SettingsView
            a={a}
            settings={settings}
            mode={store.mode}
            bookings={bookings}
            onSave={async (s) => {
              await store.saveSettings(s);
              setSettings(s);
            }}
            onResetDemo={() => {
              try {
                localStorage.removeItem("ng.bookings.v1");
              } catch {
                /* ignore */
              }
              reload();
            }}
            locale={locale}
          />
        )}
      </main>

      {editing && <BookingForm a={a} t={t} locale={locale} editing={editing} bookings={bookings} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

/* ───────── Login ───────── */

function Login({ a, locale, demo, onLogin }: { a: AdminDict; locale: Locale; demo: boolean; onLogin: (email: string, pw: string) => Promise<boolean> }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div className="adm-login">
      <form
        className="adm-login-card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const ok = await onLogin(email, pw);
          setBusy(false);
          setErr(!ok);
        }}
      >
        <Logo locale={locale} />
        <h1>{a.title}</h1>
        {!demo && (
          <div className="field">
            <label htmlFor="adm-email">{a.email}</label>
            <input id="adm-email" className="input" type="email" dir="ltr" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        )}
        <div className="field">
          <label htmlFor="adm-pw">{a.password}</label>
          <input
            id="adm-pw"
            className="input"
            type="password"
            dir="ltr"
            autoComplete="current-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            aria-invalid={err}
            aria-describedby={err ? "adm-err" : undefined}
            required
          />
          {err && (
            <span id="adm-err" className="error" role="alert">
              {a.wrong}
            </span>
          )}
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {a.login}
        </button>
        {demo && (
          <p className="adm-demo-hint">
            {a.demoHint} <code dir="ltr">{DEMO_PASSWORD}</code>
          </p>
        )}
        <div className="adm-login-foot">
          <LangSwitch locale={locale} />
          <a href={`/${locale}`}>{a.backToSite}</a>
        </div>
      </form>
    </div>
  );
}

/* ───────── Leads ───────── */

function StatusPill({ a, status }: { a: AdminDict; status: BookingStatus }) {
  return <span className={`pill pill-${status}`}>{a.statuses[status]}</span>;
}

function Leads({
  a,
  locale,
  bookings,
  onStatus,
  onEdit,
  onDelete,
}: {
  a: AdminDict;
  locale: Locale;
  bookings: Booking[];
  onStatus: (id: string, s: BookingStatus) => void;
  onEdit: (b: Booking) => void;
  onDelete: (id: string) => void;
}) {
  const t = getDict(locale);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<BookingStatus | "all">("all");
  const [when, setWhen] = useState<"upcoming" | "past" | "all">("upcoming");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const today = dateKey(new Date());
  const in7 = dateKey(new Date(Date.now() + 7 * 86400000));

  const real = bookings.filter((b) => b.source !== "block");
  const stats = {
    new: real.filter((b) => b.status === "new").length,
    today: real.filter((b) => b.date === today && ACTIVE(b)).length,
    week: real.filter((b) => b.date >= today && b.date <= in7 && ACTIVE(b)).length,
    revenue: real.filter((b) => b.date >= today && b.date <= in7 && ACTIVE(b)).reduce((s, b) => s + b.price, 0),
  };

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return real
      .filter((b) => (status === "all" ? true : b.status === status))
      .filter((b) => (when === "all" ? true : when === "upcoming" ? b.date >= today : b.date < today))
      .filter((b) => !needle || [b.name, b.phone, formatPhone(b.phone), b.carModel ?? "", b.notes ?? ""].join(" ").toLowerCase().includes(needle))
      .sort((x, y) => (when === "past" ? -1 : 1) * (x.date === y.date ? x.start - y.start : x.date < y.date ? -1 : 1));
  }, [real, q, status, when, today]);

  return (
    <>
      <section className="adm-stats" aria-label="Stats">
        <div className="stat accent">
          <span>{a.stats.new}</span>
          <strong>{stats.new}</strong>
        </div>
        <div className="stat">
          <span>{a.stats.today}</span>
          <strong>{stats.today}</strong>
        </div>
        <div className="stat">
          <span>{a.stats.week}</span>
          <strong>{stats.week}</strong>
        </div>
        <div className="stat">
          <span>{a.stats.revenue}</span>
          <strong>{formatPrice(locale, stats.revenue)}</strong>
        </div>
      </section>

      <section className="adm-toolbar">
        <label className="search">
          <IconSearch style={{ width: 18, height: 18 }} />
          <span className="sr-only">{a.search}</span>
          <input type="search" placeholder={a.search} value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="chips" role="group">
          {(["upcoming", "past", "all"] as const).map((w) => (
            <button key={w} type="button" className="chip" aria-pressed={when === w} onClick={() => setWhen(w)}>
              {w === "all" ? a.all : a[w]}
            </button>
          ))}
        </div>
        <div className="chips" role="group">
          <button type="button" className="chip" aria-pressed={status === "all"} onClick={() => setStatus("all")}>
            {a.all}
          </button>
          {STATUSES.map((s) => (
            <button key={s} type="button" className="chip" aria-pressed={status === s} onClick={() => setStatus(s)}>
              {a.statuses[s]}
            </button>
          ))}
        </div>
      </section>

      {list.length === 0 ? (
        <div className="empty">{a.empty}</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>{a.cols.when}</th>
                <th>{a.cols.customer}</th>
                <th>{a.cols.vehicle}</th>
                <th>{a.cols.services}</th>
                <th>{a.cols.price}</th>
                <th>{a.cols.source}</th>
                <th>{a.cols.status}</th>
                <th>
                  <span className="sr-only">{a.cols.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.id} className={b.status === "new" ? "is-new" : undefined}>
                  <td data-label={a.cols.when}>
                    <strong>{formatDay(locale, b.date)}</strong>
                    <span className="sub" dir="ltr">
                      {fromMinutes(b.start)}–{fromMinutes(b.start + b.duration)}
                    </span>
                  </td>
                  <td data-label={a.cols.customer}>
                    <strong>{b.name}</strong>
                    <a className="sub" href={`tel:+${b.phone}`} dir="ltr">
                      {formatPhone(b.phone)}
                    </a>
                  </td>
                  <td data-label={a.cols.vehicle}>
                    {t.booking.vehicles[b.vehicle]?.name}
                    {b.carModel && <span className="sub">{b.carModel}</span>}
                  </td>
                  <td data-label={a.cols.services}>
                    {b.services.map((s) => t.services.items[s]?.name).join(", ")}
                    {b.notes && <span className="sub note-text">“{b.notes}”</span>}
                  </td>
                  <td data-label={a.cols.price}>
                    <strong>{formatPrice(locale, b.price)}</strong>
                  </td>
                  <td data-label={a.cols.source}>
                    <span className="src">{a.sources[b.source]}</span>
                  </td>
                  <td data-label={a.cols.status}>
                    <label className="status-select">
                      <span className="sr-only">{a.cols.status}</span>
                      <select className={`pill pill-${b.status}`} value={b.status} onChange={(e) => onStatus(b.id, e.target.value as BookingStatus)}>
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {a.statuses[s]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </td>
                  <td className="row-actions">
                    <a className="icon-btn sm wa" href={waLink(b.phone, confirmMessage(b))} target="_blank" rel="noopener noreferrer" aria-label={`${a.confirmWa}: ${b.name}`} title={a.confirmWa}>
                      <IconWhatsApp />
                    </a>
                    <a className="icon-btn sm" href={`tel:+${b.phone}`} aria-label={`${a.call}: ${b.name}`} title={a.call}>
                      <IconPhone />
                    </a>
                    <button type="button" className="icon-btn sm" onClick={() => onEdit(b)} aria-label={`${a.edit}: ${b.name}`} title={a.edit}>
                      <IconEdit />
                    </button>
                    {confirmDel === b.id ? (
                      <span className="del-confirm">
                        <button type="button" className="btn btn-sm danger" onClick={() => onDelete(b.id)}>
                          {a.yes}
                        </button>
                        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirmDel(null)}>
                          {a.cancel}
                        </button>
                      </span>
                    ) : (
                      <button type="button" className="icon-btn sm" onClick={() => setConfirmDel(b.id)} aria-label={`${a.delete}: ${b.name}`} title={a.delete}>
                        <IconTrash />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ───────── Schedule ───────── */

function Schedule({ a, locale, bookings, onEdit, onBlock }: { a: AdminDict; locale: Locale; bookings: Booking[]; onEdit: (b: Booking) => void; onBlock: () => void }) {
  const t = getDict(locale);
  const days = useMemo(() => {
    const out: string[] = [];
    const d = new Date();
    d.setDate(d.getDate() - 1);
    for (let i = 0; i < 15; i++) {
      out.push(dateKey(d));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }, []);
  const [day, setDay] = useState(days[1]);
  const h = hoursFor(parseDateKey(day));
  const dayList = bookings.filter((b) => b.date === day).sort((x, y) => x.start - y.start);
  const active = dayList.filter(ACTIVE);
  const step = siteConfig.slotStep;
  const cells: { t: number; used: number }[] = [];
  if (h) {
    for (let m = toMinutes(h.open); m < toMinutes(h.close); m += step) {
      cells.push({ t: m, used: active.filter((b) => b.start < m + step && b.start + b.duration > m).length });
    }
  }
  return (
    <>
      <div className="adm-toolbar">
        <div className="days adm-days" role="group">
          {days.map((d) => {
            const count = bookings.filter((b) => b.date === d && ACTIVE(b) && b.source !== "block").length;
            return (
              <button key={d} type="button" className="day" aria-pressed={day === d} onClick={() => setDay(d)} disabled={false}>
                <small>{formatDay(locale, d, { weekday: "short" })}</small>
                <strong>{parseDateKey(d).getDate()}</strong>
                <small>{count || "·"}</small>
              </button>
            );
          })}
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onBlock}>
          {a.blockTime}
        </button>
      </div>
      <h2 className="adm-h2">{formatDay(locale, day, { weekday: "long", day: "numeric", month: "long" })}</h2>
      {!h ? (
        <div className="empty">{a.schedule.closed}</div>
      ) : (
        <div className="timeline" aria-label={`${siteConfig.bays} ${a.schedule.bays}`}>
          {cells.map((c) => (
            <div key={c.t} className="tl-cell" title={`${fromMinutes(c.t)} · ${c.used}/${siteConfig.bays}`}>
              <span dir="ltr">{c.t % 60 === 0 ? fromMinutes(c.t) : ""}</span>
              <div className="tl-bar">
                {Array.from({ length: siteConfig.bays }).map((_, i) => (
                  <i key={i} className={i < c.used ? "on" : ""} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {dayList.length === 0 ? (
        h && <div className="empty">{a.schedule.nothing}</div>
      ) : (
        <ul className="day-list">
          {dayList.map((b) => (
            <li key={b.id} className={b.source === "block" ? "block" : undefined}>
              <span className="time" dir="ltr">
                {fromMinutes(b.start)}
                <small>{fromMinutes(b.start + b.duration)}</small>
              </span>
              <span className="what">
                <strong>{b.name}</strong>
                <small>
                  {b.source === "block" ? a.sources.block : `${b.services.map((s) => t.services.items[s]?.name).join(", ")} · ${t.booking.vehicles[b.vehicle]?.name}`}
                </small>
              </span>
              {b.source !== "block" && <StatusPill a={a} status={b.status} />}
              <button type="button" className="icon-btn sm" onClick={() => onEdit(b)} aria-label={`${a.edit}: ${b.name}`}>
                <IconEdit />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* ───────── Settings ───────── */

function SettingsView({
  a,
  settings,
  mode,
  bookings,
  onSave,
  onResetDemo,
  locale,
}: {
  a: AdminDict;
  settings: Settings;
  mode: "demo" | "supabase";
  bookings: Booking[];
  onSave: (s: Settings) => Promise<void>;
  onResetDemo: () => void;
  locale: Locale;
}) {
  const t = getDict(locale);
  const [s, setS] = useState(settings);
  const [saved, setSaved] = useState(false);
  useEffect(() => setS(settings), [settings]);
  const pay = s.payment;
  const setPay = (p: Partial<Settings["payment"]>) => setS({ ...s, payment: { ...pay, ...p } });

  const exportCsv = () => {
    const rows = [
      ["date", "start", "end", "name", "phone", "vehicle", "car", "services", "price", "status", "source", "notes", "created"],
      ...bookings.map((b) => [
        b.date,
        fromMinutes(b.start),
        fromMinutes(b.start + b.duration),
        b.name,
        formatPhone(b.phone),
        t.booking.vehicles[b.vehicle]?.name ?? b.vehicle,
        b.carModel ?? "",
        b.services.map((x) => t.services.items[x]?.name ?? x).join(" + "),
        String(b.price),
        a.statuses[b.status],
        a.sources[b.source],
        b.notes ?? "",
        b.createdAt,
      ]),
    ];
    const csv = "﻿" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `bookings-${dateKey(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <form
      className="adm-settings"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSave(s);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }}
    >
      <section className="card">
        <div className="field">
          <label htmlFor="st-wa">{a.settings.whatsapp}</label>
          <input id="st-wa" className="input" dir="ltr" inputMode="numeric" value={s.whatsapp} onChange={(e) => setS({ ...s, whatsapp: e.target.value.replace(/\D/g, "") })} aria-describedby="st-wa-hint" />
          <span id="st-wa-hint" className="hint">
            {a.settings.whatsappHint}
          </span>
        </div>
      </section>

      <section className="card">
        <h2 className="adm-h3">{a.settings.payments}</h2>
        <p className="hint">{a.settings.paymentsHint}</p>
        <fieldset className="radios">
          <legend className="sr-only">{a.settings.mode}</legend>
          {(["off", "link", "provider"] as const).map((m) => (
            <label key={m} className="radio">
              <input type="radio" name="paymode" checked={pay.mode === m} onChange={() => setPay({ mode: m })} />
              <span>{a.settings.modes[m]}</span>
            </label>
          ))}
        </fieldset>
        {pay.mode !== "off" && (
          <div className="grid2">
            {pay.mode === "provider" && (
              <div className="field">
                <label htmlFor="st-prov">{a.settings.provider}</label>
                <select id="st-prov" className="select" value={pay.provider} onChange={(e) => setPay({ provider: e.target.value as Settings["payment"]["provider"] })}>
                  {Object.entries(PROVIDERS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {pay.mode === "link" && (
              <div className="field">
                <label htmlFor="st-link">{a.settings.link}</label>
                <input id="st-link" className="input" dir="ltr" type="url" placeholder="https://" value={pay.link} onChange={(e) => setPay({ link: e.target.value })} />
              </div>
            )}
            <div className="field">
              <label htmlFor="st-dep">{a.settings.deposit}</label>
              <input
                id="st-dep"
                className="input"
                type="number"
                min={0}
                max={100}
                dir="ltr"
                value={pay.depositPercent}
                onChange={(e) => setPay({ depositPercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                aria-describedby="st-dep-hint"
              />
              <span id="st-dep-hint" className="hint">
                {a.settings.depositHint}
              </span>
            </div>
          </div>
        )}
        {pay.mode === "provider" && <p className="note">{a.settings.providerNote}</p>}
      </section>

      <section className="card">
        <h2 className="adm-h3">{a.settings.data}</h2>
        <p className="hint">{mode === "demo" ? a.settings.modeDemo : a.settings.modeLive}</p>
        <div className="row-btns">
          <button type="button" className="btn btn-ghost btn-sm" onClick={exportCsv}>
            <IconDownload style={{ width: 18, height: 18 }} /> {a.settings.export}
          </button>
          {mode === "demo" && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onResetDemo}>
              {a.settings.resetDemo}
            </button>
          )}
        </div>
      </section>

      <div className="save-row">
        <button type="submit" className="btn btn-primary">
          {a.save}
        </button>
        <span role="status" className="saved">
          {saved ? a.settings.saved : ""}
        </span>
      </div>
    </form>
  );
}

/* ───────── Booking form (modal) ───────── */

function BookingForm({
  a,
  t,
  locale,
  editing,
  bookings,
  onClose,
  onSave,
}: {
  a: AdminDict;
  t: ReturnType<typeof getDict>;
  locale: Locale;
  editing: NonNullable<Editing>;
  bookings: Booking[];
  onClose: () => void;
  onSave: (b: Partial<Booking> & { id?: string }) => Promise<void>;
}) {
  const isBlock = editing.mode === "block" || (editing.mode === "edit" && editing.booking.source === "block");
  const init: Booking =
    editing.mode === "edit"
      ? editing.booking
      : {
          id: "",
          createdAt: "",
          date: dateKey(new Date()),
          start: toMinutes((hoursFor(new Date()) ?? { open: "09:00" }).open),
          duration: isBlock ? 120 : 60,
          services: isBlock ? [] : ["wash"],
          vehicle: "sedan",
          name: "",
          phone: "",
          price: isBlock ? 0 : quote(["wash"], "sedan").price,
          status: "confirmed",
          source: isBlock ? "block" : "phone",
        };
  const [b, setB] = useState<Booking>(init);
  const [phoneText, setPhoneText] = useState(init.phone ? formatPhone(init.phone) : "");
  const [err, setErr] = useState("");
  const set = (p: Partial<Booking>) => setB((cur) => ({ ...cur, ...p }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const recalc = (services: ServiceId[], vehicle: VehicleId) => {
    const q = quote(services, vehicle);
    set({ services, vehicle, price: q.price, duration: q.minutes || b.duration });
  };

  const h = hoursFor(parseDateKey(b.date));
  const times: number[] = [];
  for (let m = 7 * 60; m <= 21 * 60; m += siteConfig.slotStep) times.push(m);
  const overlap = (() => {
    const others = bookings.filter((x) => x.id !== b.id && x.date === b.date && ACTIVE(x));
    for (let c = b.start; c < b.start + b.duration; c += siteConfig.slotStep) {
      if (others.filter((x) => x.start < c + siteConfig.slotStep && x.start + x.duration > c).length >= siteConfig.bays) return true;
    }
    return false;
  })();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlock) {
      await onSave({ ...b, id: b.id || undefined, name: b.name || a.sources.block, phone: b.phone || "0", services: [], price: 0, source: "block", status: "confirmed" });
      return;
    }
    const phone = normalizeIlPhone(phoneText);
    if (!b.name.trim() || !phone || !b.date || b.services.length === 0) {
      setErr(a.form.errRequired);
      return;
    }
    const { id, createdAt: _c, ...rest } = b;
    void _c;
    await onSave({ ...rest, ...(id ? { id } : {}), name: b.name.trim(), phone });
  };

  const title = editing.mode === "edit" ? (isBlock ? a.form.blockTitle : a.form.editTitle) : isBlock ? a.form.blockTitle : a.form.newTitle;

  return (
    <div className="modal-wrap" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" role="dialog" aria-modal="true" aria-labelledby="bf-title" onSubmit={submit}>
        <div className="modal-head">
          <h2 id="bf-title">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={a.cancel}>
            <IconX />
          </button>
        </div>
        <div className="modal-body">
          {isBlock ? (
            <div className="field">
              <label htmlFor="bf-name">{a.form.blockReason}</label>
              <input id="bf-name" className="input" value={b.name} onChange={(e) => set({ name: e.target.value })} autoFocus />
            </div>
          ) : (
            <div className="grid2">
              <div className="field">
                <label htmlFor="bf-name">{a.form.name}</label>
                <input id="bf-name" className="input" value={b.name} onChange={(e) => set({ name: e.target.value })} autoFocus />
              </div>
              <div className="field">
                <label htmlFor="bf-phone">{a.form.phone}</label>
                <input id="bf-phone" className="input" type="tel" value={phoneText} onChange={(e) => setPhoneText(e.target.value)} placeholder="050-123-4567" />
              </div>
              <div className="field">
                <label htmlFor="bf-vehicle">{a.form.vehicle}</label>
                <select id="bf-vehicle" className="select" value={b.vehicle} onChange={(e) => recalc(b.services, e.target.value as VehicleId)}>
                  {siteConfig.vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {t.booking.vehicles[v.id].name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="bf-car">{a.form.car}</label>
                <input id="bf-car" className="input" value={b.carModel ?? ""} onChange={(e) => set({ carModel: e.target.value })} />
              </div>
            </div>
          )}

          {!isBlock && (
            <fieldset className="field svc-pick">
              <legend>{a.form.services}</legend>
              <div className="chips">
                {siteConfig.services.map((s) => {
                  const on = b.services.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className="chip"
                      aria-pressed={on}
                      onClick={() => recalc(on ? b.services.filter((x) => x !== s.id) : [...b.services, s.id], b.vehicle)}
                    >
                      {t.services.items[s.id].name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <div className="grid3">
            <div className="field">
              <label htmlFor="bf-date">{a.form.date}</label>
              <input id="bf-date" className="input" type="date" dir="ltr" value={b.date} onChange={(e) => set({ date: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="bf-start">{a.form.start}</label>
              <select id="bf-start" className="select" dir="ltr" value={b.start} onChange={(e) => set({ start: Number(e.target.value) })}>
                {times.map((m) => (
                  <option key={m} value={m}>
                    {fromMinutes(m)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="bf-dur">{a.form.duration}</label>
              <input id="bf-dur" className="input" type="number" dir="ltr" min={15} step={15} value={b.duration} onChange={(e) => set({ duration: Math.max(15, Number(e.target.value) || 15) })} />
            </div>
          </div>
          {!h && <p className="warn">{a.form.closed}</p>}
          {overlap && <p className="warn">{a.form.full}</p>}

          {!isBlock && (
            <>
              <div className="grid3">
                <div className="field">
                  <label htmlFor="bf-price">{a.form.price}</label>
                  <input id="bf-price" className="input" type="number" dir="ltr" min={0} value={b.price} onChange={(e) => set({ price: Number(e.target.value) || 0 })} />
                </div>
                <div className="field">
                  <label htmlFor="bf-status">{a.form.status}</label>
                  <select id="bf-status" className="select" value={b.status} onChange={(e) => set({ status: e.target.value as BookingStatus })}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {a.statuses[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="bf-source">{a.form.source}</label>
                  <select id="bf-source" className="select" value={b.source} onChange={(e) => set({ source: e.target.value as BookingSource })}>
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {a.sources[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="bf-notes">{a.form.notes}</label>
                <textarea id="bf-notes" className="textarea" value={b.notes ?? ""} onChange={(e) => set({ notes: e.target.value })} />
              </div>
              <p className="hint">
                {formatPrice(locale, quote(b.services, b.vehicle).price)} · {quote(b.services, b.vehicle).minutes} {a.minutes}
              </p>
            </>
          )}
          {err && (
            <p className="error" role="alert">
              {err}
            </p>
          )}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {a.cancel}
          </button>
          <button type="submit" className="btn btn-primary">
            {a.save}
          </button>
        </div>
      </form>
    </div>
  );
}
