import { notFound } from "next/navigation";
import { getDict, isLocale } from "@/lib/i18n";
import { BookingProvider } from "@/components/site/BookingContext";
import Header from "@/components/site/Header";
import BookingDrawer from "@/components/site/BookingDrawer";
import Floating from "@/components/site/Floating";
import { MacroScene, Reveal, WashHero } from "@/components/site/Scenes";
import { Contact, Footer, Process, Promises, Services } from "@/components/site/Sections";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  return (
    <BookingProvider>
      <a href="#main" className="skip-link">
        {t.skip}
      </a>
      <Header locale={locale} t={t} />
      <main id="main">
        <WashHero t={t} />
        <Promises t={t} />
        <MacroScene t={t} />
        <Services locale={locale} t={t} />
        <Process t={t} />
        <Reveal t={t} />
        <Contact locale={locale} t={t} />
      </main>
      <Footer locale={locale} t={t} />
      <Floating locale={locale} t={t} />
      <BookingDrawer locale={locale} t={t} />
    </BookingProvider>
  );
}
