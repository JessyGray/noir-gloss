import { NextResponse, type NextRequest } from "next/server";
import { locales, type Locale } from "@/lib/i18n";

const DEFAULT: Locale = "he";

function pick(header: string | null): Locale {
  if (!header) return DEFAULT;
  for (const part of header.split(",")) {
    const code = part.split(";")[0].trim().slice(0, 2).toLowerCase();
    if ((locales as readonly string[]).includes(code)) return code as Locale;
    if (code === "iw") return "he";
  }
  return DEFAULT;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const first = pathname.split("/")[1];
  if ((locales as readonly string[]).includes(first)) return;
  const url = req.nextUrl.clone();
  url.pathname = `/${pick(req.headers.get("accept-language"))}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|img|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"],
};
