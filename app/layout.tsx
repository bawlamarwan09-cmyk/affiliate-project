import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Geist, Manrope } from "next/font/google";
import { Analytics, AnalyticsNoScript } from "./components/Analytics";
import { DealsEmailPopup } from "./components/DealsEmailPopup";
import { JsonLd } from "./components/JsonLd";
import { api } from "./lib/api";
import { absoluteUrl, siteUrl } from "./lib/seo";
import "./globals.css";
import "./public-pages.css";
import "./product-detail.css";
import "./seo-pages.css";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
const display = Manrope({ variable: "--font-display", subsets: ["latin"], display: "swap" });
const colorPattern = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const safeColor = (value: string | undefined, fallback: string) => value && colorPattern.test(value) ? value : fallback;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await api.settings();
  const name = settings.websiteName || "Bargain MOM";
  const title = settings.defaultSeoTitle || `${name} — Helpful deals and buying advice`;
  const description = settings.defaultSeoDescription || "Independent deal context, product research, and practical buying guidance for U.S. shoppers.";
  const configuredFavicon = settings.favicon?.trim();
  const favicon = configuredFavicon && configuredFavicon !== "/favicon.svg"
    ? configuredFavicon
    : "/favicon.svg?v=3";

  return {
    metadataBase: new URL(siteUrl(settings)),
    title: { default: title, template: `%s | ${name}` },
    description,
    applicationName: name,
    icons: { icon: favicon, shortcut: favicon },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: name,
      title,
      description,
      url: absoluteUrl("/", settings),
    },
    verification: {
      google: settings.googleSiteVerification || undefined,
      other: settings.bingSiteVerification
        ? { "msvalidate.01": settings.bingSiteVerification }
        : undefined,
    },
    formatDetection: { address: false, email: false, telephone: false },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await api.settings();
  const name = settings.websiteName || "Bargain MOM";
  const origin = siteUrl(settings);
  const logo = settings.logo || "/brand/bargain-mom-logo.webp";
  const primary = safeColor(settings.primaryColor, "#101a2f");
  const accent = safeColor(settings.accentColor, "#f36b2b");
  const theme = { "--navy": primary, "--navy2": primary, "--ink": primary, "--orange": accent, "--accent": accent } as CSSProperties;
  const socialValues = settings.socialMedia && typeof settings.socialMedia === "object"
    ? Object.values(settings.socialMedia).filter((value): value is string => typeof value === "string" && value.startsWith("http"))
    : [];
  const schema = settings.homepageSchemaEnabled === false ? null : [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${origin}/#organization`,
      name,
      url: `${origin}/`,
      logo: absoluteUrl(logo, settings),
      email: settings.supportEmail || undefined,
      sameAs: socialValues.length ? socialValues : undefined,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${origin}/#website`,
      name,
      url: `${origin}/`,
      inLanguage: "en-US",
      publisher: { "@id": `${origin}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${origin}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <html lang="en-US">
      <body className={`${sans.variable} ${display.variable}`} style={theme}>
        <AnalyticsNoScript ids={settings.analyticsIds} />
        <JsonLd id="site-jsonld" data={schema} />
        {children}
        <DealsEmailPopup label={settings.newsletterTitle} description={settings.newsletterText} />
        <Analytics ids={settings.analyticsIds} />
      </body>
    </html>
  );
}
