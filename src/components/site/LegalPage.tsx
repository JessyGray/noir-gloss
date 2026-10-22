import type { Dict, Locale } from "@/lib/i18n";
import type { LegalDoc } from "@/lib/i18n/legal";
import { BookingProvider } from "./BookingContext";
import Header from "./Header";
import Floating from "./Floating";
import BookingDrawer from "./BookingDrawer";
import { Footer } from "./Sections";

export default function LegalPage({ locale, t, doc }: { locale: Locale; t: Dict; doc: LegalDoc }) {
  return (
    <BookingProvider>
      <a href="#main" className="skip-link">
        {t.skip}
      </a>
      <Header locale={locale} t={t} />
      <main id="main" className="legal container">
        <article>
          <h1 className="display">{doc.title}</h1>
          <p>{doc.updated}</p>
          {doc.sections.map((s) => (
            <section key={s.h}>
              <h2>{s.h}</h2>
              {s.p.length > 1 ? (
                <ul>
                  {s.p.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              ) : (
                <p>{s.p[0]}</p>
              )}
            </section>
          ))}
          <p>
            <a href={`/${locale}`}>← {t.nav.services}</a>
          </p>
        </article>
      </main>
      <Footer locale={locale} t={t} />
      <Floating locale={locale} t={t} />
      <BookingDrawer locale={locale} t={t} />
    </BookingProvider>
  );
}
