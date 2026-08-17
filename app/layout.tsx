import type { Metadata } from "next";
import { Geist, Manrope } from "next/font/google";
import { Analytics } from "./components/Analytics";
import { JsonLd } from "./components/JsonLd";
import { api } from "./lib/api";
import { absoluteUrl, siteUrl } from "./lib/seo";
import "./globals.css";
import "./public-pages.css";
import "./product-detail.css";
import "./seo-pages.css";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
const display = Manrope({ variable: "--font-display", subsets: ["latin"], display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await api.settings();
  const name = settings.websiteName || "Bargain MOM";
  const title = settings.defaultSeoTitle || `${name} — Helpful deals and buying advice`;
  const description = settings.defaultSeoDescription || "Independent deal context, product research, and practical buying guidance for U.S. shoppers.";

  return {
    metadataBase: new URL(siteUrl(settings)),
    title: { default: title, template: `%s | ${name}` },
    description,
    applicationName: name,
    icons: { icon: settings.favicon || "/favicon.svg" },
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
      logo: settings.logo ? absoluteUrl(settings.logo, settings) : undefined,
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
      <body className={`${sans.variable} ${display.variable}`}>
        <JsonLd id="site-jsonld" data={schema} />
        {children}
        <Analytics ids={settings.analyticsIds} />
      </body>
    </html>
  );
}
