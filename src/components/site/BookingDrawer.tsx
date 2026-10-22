"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { siteConfig, type ServiceId, type VehicleId } from "@/lib/config";
import { availableSlots, dateKey, fromMinutes, hoursFor, normalizeIlPhone, quote, type Booking } from "@/lib/booking";
import { formatPrice, type Dict, type Locale } from "@/lib/i18n";
import { defaultSettings, getStore, type BusyItem, type Settings } from "@/lib/store";
import { customerMessage, formatDay, waLink } from "@/lib/whatsapp";
import { useBooking } from "./BookingContext";
import { CarIcon, IconCard, IconCheck, IconInfo, IconWhatsApp, IconX } from "../icons";

type Step = 0 | 1 | 2 | 3 | 4; // 4 = success

function durationLabel(t: Dict, min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return [h ? `${h} ${t.booking.hoursShort}` : "", m ? `${m} ${t.booking.minShort}` : ""].filter(Boolean).join(" ");
}

export default function BookingDrawer({ locale, t }: { locale: Locale; t: Dict }) {
  const { open, preset, closeBooking } = useBooking();
  const [step, setStep] = useState<Step>(0);
  const [vehicle, setVehicle] = useState<VehicleId | null>(null);
  const [services, setServices] = useState<ServiceId[]>([]);
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [car, setCar] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string; form?: string }>({});
  const [busy, setBusy] = useState<BusyItem[] | null>(null);
  const [sending, setSending] = useState(false);
  const [booked, setBooked] = useState<Booking | null>(null);
  const [settings, setSettings] = useState<Settings>(defaultSettings(siteConfig.phone));
  const panel = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const days = useMemo(() => {
    const out: string[] = [];
    const d = new Date();
    for (let i = 0; i < siteConfig.bookingDaysAhead; i++) {
      out.push(dateKey(d));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }, []);

  // reset / preset on open
  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement;
    if (step === 4) {
      setStep(0);
      setServices([]);
      setDay(null);
      setSlot(null);
      setBooked(null);
    }
    if (preset) setServices((s) => (s.includes(preset) ? s : [...s, preset]));
    document.body.style.overflow = "hidden";
    setTimeout(() => panel.current?.querySelector<HTMLElement>("h2")?.focus(), 50);
    getStore()
      .getSettings()
      .then((s) => s && setSettings(s))
      .catch(() => {});
    return () => {
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preset]);

  // Esc + focus trap
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeBooking();
        lastFocus.current?.focus();
      }
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input, textarea, select, [tabindex="0"]');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeBooking]);

  // load occupied time when reaching the time step
  useEffect(() => {
    if (step !== 2) return;
    setBusy(null);
    getStore()
      .busy(days[0], days[days.length - 1])
      .then(setBusy)
      .catch(() => setBusy([]));
  }, [step, days]);

  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [step]);

  const q = quote(services, vehicle ?? "sedan");
  const slots = useMemo(() => (day && busy ? availableSlots(day, q.minutes, busy) : []), [day, busy, q.minutes]);

  // first open day with free time
  useEffect(() => {
    if (step !== 2 || !busy || day) return;
    const first = days.find((d) => availableSlots(d, q.minutes, busy).length > 0);
    if (first) setDay(first);
  }, [step, busy, day, days, q.minutes]);

  useEffect(() => {
    if (slot !== null && !slots.includes(slot)) setSlot(null);
  }, [slots, slot]);

  const canNext = [vehicle !== null, services.length > 0, day !== null && slot !== null, true][step] ?? false;

  async function submit() {
    const errs: typeof errors = {};
    if (name.trim().length < 2) errs.name = t.booking.errName;
    const normalized = normalizeIlPhone(phone);
    if (!normalized) errs.phone = t.booking.errPhone;
    setErrors(errs);
    if (Object.keys(errs).length || !vehicle || !day || slot === null) return;
    setSending(true);
    try {
      const b = await getStore().create({
        date: day,
        start: slot,
        duration: q.minutes,
        services,
        vehicle,
        name: name.trim(),
        phone: normalized!,
        carModel: car.trim() || undefined,
        notes: notes.trim() || undefined,
        price: q.price,
        status: "new",
        source: "website",
        locale,
      });
      setBooked(b);
      setStep(4);
    } catch {
      setErrors({ form: t.booking.errGeneric });
    } finally {
      setSending(false);
    }
  }

  const next = () => (step < 3 ? setStep((s) => (s + 1) as Step) : submit());
  const back = () => setStep((s) => Math.max(0, s - 1) as Step);
  const close = () => {
    closeBooking();
    lastFocus.current?.focus();
  };

  const stepLabels = [t.booking.stepVehicle, t.booking.stepServices, t.booking.stepTime, t.booking.stepDetails];
  const pay = settings.payment;
  const payAmount = booked ? (pay.depositPercent > 0 ? Math.round((booked.price * pay.depositPercent) / 100) : booked.price) : 0;

  return (
    <>
      <div className={`scrim${open ? " open" : ""}`} onClick={close} aria-hidden />
      <div
        ref={panel}
        className={`drawer${open ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        aria-hidden={!open}
      >
        <div className="drawer-head">
          <div className="top">
            <h2 id="booking-title" tabIndex={-1}>
              {t.booking.title}
            </h2>
            <button type="button" className="icon-btn" onClick={close} aria-label={t.booking.close}>
              <IconX />
            </button>
          </div>
          {step < 4 && (
            <ol className="steps" aria-label={`${step + 1} / 4`}>
              {stepLabels.map((l, i) => (
                <li key={l} className={i < step ? "done" : i === step ? "current" : ""} aria-current={i === step ? "step" : undefined}>
                  <span>{l}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="drawer-body" ref={body}>
          {step === 0 && (
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend>
                <h3>{t.booking.chooseVehicle}</h3>
              </legend>
              <div className="choice-list" role="radiogroup">
                {siteConfig.vehicles.map((v) => {
                  const label = t.booking.vehicles[v.id];
                  const delta = Math.round((v.priceFactor - 1) * 100);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="radio"
                      aria-checked={vehicle === v.id}
                      className="choice"
                      onClick={() => {
                        setVehicle(v.id);
                        setTimeout(() => setStep(1), 180);
                      }}
                    >
                      <CarIcon kind={v.id} />
                      <span className="body">
                        <strong>{label.name}</strong>
                        <small>{label.ex}</small>
                      </span>
                      <span className="side">
                        <small dir="ltr">{delta === 0 ? "" : `${delta > 0 ? "+" : ""}${delta}%`}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {step === 1 && (
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend>
                <h3>{t.booking.chooseServices}</h3>
              </legend>
              <div className="choice-list">
                {siteConfig.services.map((s) => {
                  const on = services.includes(s.id);
                  const sq = quote([s.id], vehicle ?? "sedan");
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      className="choice"
                      onClick={() => setServices((cur) => (on ? cur.filter((x) => x !== s.id) : [...cur, s.id]))}
                    >
                      <span className="check">{on && <IconCheck style={{ width: 14, height: 14 }} />}</span>
                      <span className="body">
                        <strong>{t.services.items[s.id].name}</strong>
                        <small>{durationLabel(t, sq.minutes)}</small>
                      </span>
                      <span className="side">
                        <strong>{formatPrice(locale, sq.price)}</strong>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {step === 2 && (
            <div>
              <h3 id="day-label">{t.booking.chooseDay}</h3>
              <div className="days" role="group" aria-labelledby="day-label">
                {days.map((d) => {
                  const closed = !hoursFor(new Date(d + "T12:00:00"));
                  const full = !closed && busy !== null && availableSlots(d, q.minutes, busy).length === 0;
                  const date = new Date(d + "T12:00:00");
                  return (
                    <button
                      key={d}
                      type="button"
                      className="day"
                      aria-pressed={day === d}
                      disabled={closed || full}
                      onClick={() => setDay(d)}
                      aria-label={`${formatDay(locale, d, { weekday: "long", day: "numeric", month: "long" })}${closed ? `, ${t.booking.closedDay}` : ""}`}
                    >
                      <small>{formatDay(locale, d, { weekday: "short" })}</small>
                      <strong>{date.getDate()}</strong>
                      <small>{formatDay(locale, d, { month: "short" })}</small>
                    </button>
                  );
                })}
              </div>
              <h3 id="slot-label" style={{ marginTop: 22 }}>
                {t.booking.chooseTime}
              </h3>
              {busy === null ? (
                <div className="empty">{t.booking.loading}</div>
              ) : slots.length === 0 ? (
                <div className="empty">{t.booking.noSlots}</div>
              ) : (
                <div className="slots" role="group" aria-labelledby="slot-label">
                  {slots.map((m) => (
                    <button key={m} type="button" className="slot" aria-pressed={slot === m} onClick={() => setSlot(m)}>
                      ~{fromMinutes(m)}
                    </button>
                  ))}
                </div>
              )}
              <p className="note">
                <IconInfo />
                <span>{t.booking.approxNote}</span>
              </p>
            </div>
          )}

          {step === 3 && (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <div className="field">
                <label htmlFor="bk-name">{t.booking.name}</label>
                <input
                  id="bk-name"
                  className="input"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "bk-name-err" : undefined}
                />
                {errors.name && (
                  <span id="bk-name-err" className="error" role="alert">
                    {errors.name}
                  </span>
                )}
              </div>
              <div className="field">
                <label htmlFor="bk-phone">{t.booking.phone}</label>
                <input
                  id="bk-phone"
                  className="input"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="050-123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "bk-phone-err" : "bk-phone-hint"}
                />
                {errors.phone ? (
                  <span id="bk-phone-err" className="error" role="alert">
                    {errors.phone}
                  </span>
                ) : (
                  <span id="bk-phone-hint" className="hint">
                    {t.booking.phoneHint}
                  </span>
                )}
              </div>
              <div className="field">
                <label htmlFor="bk-car">{t.booking.car}</label>
                <input id="bk-car" className="input" value={car} onChange={(e) => setCar(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="bk-notes">{t.booking.notes}</label>
                <textarea id="bk-notes" className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              {errors.form && (
                <p className="error" role="alert">
                  {errors.form}
                </p>
              )}
              <p className="consent">
                {t.booking.consent} <a href={`/${locale}/privacy`}>{t.footer.privacy}</a>
              </p>
              <button type="submit" hidden />
            </form>
          )}

          {step === 4 && booked && (
            <div className="success" aria-live="polite">
              <div className="tick">
                <IconCheck />
              </div>
              <h3>{t.booking.successTitle}</h3>
              <p>{t.booking.successBody}</p>
              <dl className="summary">
                <div>
                  <dt>{t.booking.waServices}</dt>
                  <dd>{booked.services.map((s) => t.services.items[s].name).join(", ")}</dd>
                </div>
                <div>
                  <dt>{t.booking.waVehicle}</dt>
                  <dd>{t.booking.vehicles[booked.vehicle].name}</dd>
                </div>
                <div>
                  <dt>{t.booking.waWhen}</dt>
                  <dd>
                    {formatDay(locale, booked.date, { weekday: "short", day: "numeric", month: "short" })}, ~{fromMinutes(booked.start)}
                  </dd>
                </div>
                <div>
                  <dt>{t.booking.total}</dt>
                  <dd>{formatPrice(locale, booked.price)}</dd>
                </div>
              </dl>
              <div className="actions">
                <a className="btn btn-wa" href={waLink(settings.whatsapp || siteConfig.phone, customerMessage(locale, booked))} target="_blank" rel="noopener noreferrer">
                  <IconWhatsApp /> {t.booking.sendWhatsapp}
                </a>
                {pay.mode === "link" && pay.link && (
                  <a className="btn btn-ghost" href={pay.link} target="_blank" rel="noopener noreferrer">
                    <IconCard /> {pay.depositPercent > 0 ? t.booking.payDeposit : t.booking.payFull} · {formatPrice(locale, payAmount)}
                  </a>
                )}
                <button type="button" className="btn btn-ghost" onClick={close}>
                  {t.booking.done}
                </button>
              </div>
            </div>
          )}
        </div>

        {step < 4 && (
          <div className="drawer-foot">
            <div className="totals" aria-live="polite">
              <div>
                <div className="label">{t.booking.total}</div>
                <div className="value">{services.length ? formatPrice(locale, q.price) : "—"}</div>
              </div>
              <div className="dur">
                <div className="label">{t.booking.duration}</div>
                <div className="value">{services.length ? durationLabel(t, q.minutes) : "—"}</div>
              </div>
            </div>
            <div className="foot-actions">
              {step > 0 && (
                <button type="button" className="btn btn-ghost" onClick={back}>
                  {t.booking.back}
                </button>
              )}
              <button type="button" className="btn btn-primary" disabled={!canNext || sending} onClick={next}>
                {step === 3 ? (sending ? t.booking.sending : t.booking.confirm) : t.booking.next}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
