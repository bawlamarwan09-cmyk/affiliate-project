import { Header } from "./components/Header";
import { HomepageRenderer } from "./components/HomepageRenderer";
import { SiteFooter } from "./components/SiteFooter";
import { api } from "./lib/api";

export const metadata = {
  title: "Dealora — Curated deals, managed beautifully",
  description: "A modern, editorial affiliate commerce platform.",
};

export default async function Home() {
  const [homepage, navigation, settings, footer] = await Promise.all([
    api.homepage(), api.navigation(), api.settings(), api.footer(),
  ]);

  return (
    <div className="site-shell">
      <Header navigation={navigation} settings={settings} />
      <main>
        <HomepageRenderer sections={homepage.sections} />
      </main>
      <SiteFooter data={footer} settings={settings} />
    </div>
  );
}
