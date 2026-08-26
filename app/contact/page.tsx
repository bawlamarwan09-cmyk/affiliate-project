import type { Metadata } from "next";
import { cache } from "react";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { JsonLd } from "../components/JsonLd";
import { PublicShell } from "../components/PublicShell";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";
import { publicApi } from "../lib/public-api";
import { absoluteUrl, entityMetadata } from "../lib/seo";
import { RichText, styles } from "../guides/ContentPrimitives";
import { ContactForm } from "./ContactForm";

type ContactPageData = {
  id: string;
  slug: string;
  title: string;
  intro?: string | null;
  content: string;
  publishedAt?: string | null;
  updatedAt: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  schemaEnabled?: boolean;
};

const getContactPage = cache(() => publicApi<ContactPageData>("/pages/contact"));

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getContactPage(), api.settings()]);
  return entityMetadata(
    page || {},
    {
      title: page?.title || "Contact",
      description: page?.intro || "Contact Bargain MOM about corrections, editorial questions, or business inquiries.",
      path: "/contact",
    },
    settings,
  );
}

export default async function ContactPage() {
  const [page, settings] = await Promise.all([getContactPage(), api.settings()]);
  const title = page?.title || "Contact";
  const intro = page?.intro || "Contact Bargain MOM about corrections, editorial questions, or business inquiries.";
  const schema = page?.schemaEnabled
    ? {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: title,
        description: intro,
        url: absoluteUrl(page.canonicalUrl || "/contact", settings),
        datePublished: page.publishedAt || undefined,
        dateModified: page.updatedAt,
      }
    : null;

  return (
    <PublicShell>
      <article className={`${styles.page} ${styles.narrow} ${styles.legal} contact-page`}>
        <Breadcrumbs items={[{ name: "Home", url: "/" }, { name: title, url: "/contact" }]} settings={settings} schema={page?.schemaEnabled !== false} />
        <header>
          <span className={styles.eyebrow}>Bargain MOM</span>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.lead}>{intro}</p>
          {page?.updatedAt && <p className={styles.meta}>Last updated <time dateTime={page.updatedAt}>{formatDate(page.updatedAt)}</time></p>}
        </header>
        {page?.content && <div className={styles.body}><RichText text={page.content} /></div>}
        {settings.supportEmail && (
          <aside className="contact-email-card">
            <span>Email us directly</span>
            <a href={`mailto:${settings.supportEmail}`}>{settings.supportEmail}</a>
          </aside>
        )}
        <section className="contact-form-section" aria-labelledby="contact-form-title">
          <h2 id="contact-form-title">Send a message</h2>
          <p>Use this form for corrections, editorial questions, or business inquiries.</p>
          <ContactForm />
        </section>
        {schema && <JsonLd id="contact-page-jsonld" data={schema} />}
      </article>
    </PublicShell>
  );
}
