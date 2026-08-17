import type { FooterData, HomepageSection, NavItem, SiteSettings } from "./types";

const base = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
async function get<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${base}${path}`, { next: { revalidate: 60 } });
    if (!response.ok) return fallback;
    return response.json() as Promise<T>;
  } catch { return fallback; }
}

export const api = {
  homepage: () => get<{ sections: HomepageSection[] }>("/homepage", { sections: [] }),
  navigation: () => get<NavItem[]>("/navigation", []),
  settings: () => get<SiteSettings>("/settings", {}),
  footer: () => get<FooterData>("/footer", {}),
};
