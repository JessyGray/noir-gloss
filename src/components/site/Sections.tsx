import { siteConfig } from "@/lib/config";
import { quote } from "@/lib/booking";
import { formatPrice, intlTag, type Dict, type Locale } from "@/lib/i18n";
import { waLink } from "@/lib/whatsapp";
import { formatPhone } from "@/lib/booking";
import { BookButton } from "./BookingContext";
import { FadeUp } from "./Scenes";
import { Logo } from "./Header";
import { IconArrow, IconPhone, IconPin, IconWhatsApp } from "../icons";

export function Promises({ t }: { t: Dict }) {
  return (
    <section className="promises" aria-label={siteConfig.brand}>
      <div className="container">
        <FadeUp as="ul">
          {t.promises.map((p) => (
            <li key={p.l}>
              <strong>{p.v}</strong>
              <span>{p.l}</span>
            </li>
          ))}
        </FadeUp>
      </div>
    </section>
  );
}

export function Services({ locale, t }: { locale: Locale; t: Dict }) {
  return (
    <section id="services" className="section" aria-labelledby="services-title">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">{t.services.eyebrow}</span>
          <h2 id="services-title" className="display h2">
            {t.services.title}
          </h2>
          <p className="lead">{t.services.sub}</p>
        </div>
        <FadeUp className="services-grid">
          {siteConfig.services.map((s, i) => {
            const item = t.services.items[s.id];
            return (
              <article key={s.id} className={`service-card${s.featured ? " featured" : ""}`}>
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
                <h3>{item.name}</h3>
                <p>{item.desc}</p>
                <div className="row">
                  <span className="price">
                    <small>{t.services.from}</small>
                    {formatPrice(locale, quote([s.id], "sedan").price)}
                  </span>
                  <BookButton className="btn btn-ghost btn-sm" service={s.id}>
                    {t.services.book} <IconArrow style={{ width: 16, height: 16 }} />
                  </BookButton>
                </div>
              </article>
            );
          })}
        </FadeUp>
      </div>
    </section>
  );
}

export function Process({ t }: { t: Dict }) {
  return (
    <section id="process" className="section" style={{ paddingTop: 0 }} aria-labelledby="process-title">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">{t.process.eyebrow}</span>
          <h2 id="process-title" className="display h2">
            {t.process.title}
          </h2>
        </div>
        <FadeUp as="ol" className="process-list">
          {t.process.steps.map((s) => (
            <li key={s.t}>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </li>
          ))}
        </FadeUp>
      </div>
    </section>
  );
}

export function Contact({ locale, t }: { locale: Locale; t: Dict }) {
  // Week starting Sunday (Israel)
  const sunday = new Date(2024, 0, 7);
  const dayName = (i: number) =>
    new Intl.DateTimeFormat(intlTag(locale), { weekday: "long" }).format(new Date(sunday.getTime() + i * 86400000));
  return (
    <section id="contact" className="section" aria-labelledby="contact-title">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">{t.contact.eyebrow}</span>
          <h2 id="contact-title" className="display h2">
            {t.contact.title}
          </h2>
        </div>
        <div className="contact-grid">
          <div className="card contact-main">
            <div>
              <h3>{t.contact.address}</h3>
              <p className="big">{siteConfig.address[locale]}</p>
            </div>
            <div>
              <h3>{t.contact.phone}</h3>
              <p className="big">
                <a href={`tel:+${siteConfig.phone}`} dir="ltr" style={{ textDecoration: "none" }}>
                  {formatPhone(siteConfig.phone)}
                </a>
              </p>
            </div>
            <div className="actions">
              <a className="btn btn-wa" href={waLink(siteConfig.phone, "")} target="_blank" rel="noopener noreferrer">
                <IconWhatsApp /> {t.contact.whatsapp}
              </a>
              <a className="btn btn-ghost" href={siteConfig.mapUrl} target="_blank" rel="noopener noreferrer">
                <IconPin /> {t.contact.directions}
              </a>
              <a className="btn btn-ghost" href={`tel:+${siteConfig.phone}`}>
                <IconPhone /> {t.contact.phone}
              </a>
            </div>
          </div>
          <div className="card">
            <h3>{t.contact.hours}</h3>
            <table className="hours">
              <tbody>
                {[0, 1, 2, 3, 4, 5, 6].map((d) => {
                  const h = siteConfig.hours[d];
                  return (
                    <tr key={d}>
                      <td>{dayName(d)}</td>
                      <td>{h ? `${h.open}–${h.close}` : t.contact.closed}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer({ locale, t }: { locale: Locale; t: Dict }) {
  return (
    <footer className="site-footer">
      <div className="container">
        <Logo locale={locale} />
        <nav aria-label="Footer">
          <a href={`/${locale}/accessibility`}>{t.footer.accessibility}</a>
          <a href={`/${locale}/privacy`}>{t.footer.privacy}</a>
          <a href={`/${locale}/admin`}>{t.footer.admin}</a>
        </nav>
        <span>
          © {new Date().getFullYear()} {siteConfig.brand}. {t.footer.rights}
        </span>
        <p className="demo">{t.footer.demo}</p>
      </div>
    </footer>
  );
}
