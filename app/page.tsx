import type { Metadata } from "next";
import { Header } from "./components/Header";
import { HomepageRenderer } from "./components/HomepageRenderer";
import { PageEvent } from "./components/PageEvent";
import { SiteFooter } from "./components/SiteFooter";
import { api } from "./lib/api";
import { entityMetadata } from "./lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await api.settings();
  return entityMetadata(
    {
      seoTitle: settings.homepageSeoTitle,
      seoDescription: settings.homepageSeoDescription,
      canonicalUrl: settings.homepageCanonicalUrl,
      ogTitle: settings.homepageOgTitle,
      ogDescription: settings.homepageOgDescription,
      ogImage: settings.homepageOgImage,
      robotsIndex: settings.homepageRobotsIndex,
      robotsFollow: settings.homepageRobotsFollow,
      schemaEnabled: settings.homepageSchemaEnabled,
    },
    {
      title: settings.defaultSeoTitle || `${settings.websiteName || "Bargain MOM"} deals and buying advice`,
      description: settings.defaultSeoDescription || "Useful product research, current deal context, and practical buying guidance for U.S. shoppers.",
      path: "/",
      image: settings.homepageOgImage,
    },
    settings,
  );
}

export default async function Home() {
  const [homepage, navigation, settings, footer] = await Promise.all([
    api.homepage(), api.navigation(), api.settings(), api.footer(),
  ]);

  return (
    <div className="site-shell">
      <Header navigation={navigation} settings={settings} />
      <main>
        <PageEvent name="homepage_view" />
        <HomepageRenderer sections={homepage.sections} disclosure={settings.affiliateDisclosure} />
      </main>
      <SiteFooter data={footer} settings={settings} />
    </div>
  );
}
