export type SiteSettings = { websiteName?: string; logo?: string; supportEmail?: string; accentColor?: string; affiliateDisclosure?: string };
export type NavItem = { id: string; label: string; url: string; children?: NavItem[] };
export type Product = { id: string; slug: string; title: string; shortDescription?: string; image?: string; currentPrice?: number; oldPrice?: number; discountPercent?: number; rating?: number; reviewCount?: number; affiliateUrl: string; ctaLabel?: string; badge?: string; store?: { name: string; logo?: string } };
export type Category = { id: string; name: string; slug: string; image?: string; icon?: string };
export type Store = { id: string; name: string; slug: string; logo?: string; color?: string };
export type BlogPost = { id: string; slug: string; title: string; coverImage?: string; publishedAt?: string; readingTime?: number; category?: { name: string } };
export type HomepageSection = { id: string; type: string; title?: string; subtitle?: string; background?: string; ctaText?: string; ctaUrl?: string; config?: Record<string, unknown>; products?: Product[]; categories?: Category[]; stores?: Store[]; posts?: BlogPost[] };
export type FooterData = { description?: string; newsletterText?: string; copyrightText?: string; columns?: { id: string; title: string; links: NavItem[] }[] };
