export type Status = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type SeoFields = {
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  robotsIndex?: boolean | null;
  robotsFollow?: boolean | null;
  schemaEnabled?: boolean | null;
};

export type FaqItem = { question: string; answer: string };
export type PaginationData = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export type SiteSettings = {
  websiteName?: string;
  logo?: string | null;
  favicon?: string | null;
  supportEmail?: string | null;
  primaryColor?: string;
  accentColor?: string;
  affiliateDisclosure?: string | null;
  searchPlaceholder?: string | null;
  headerCtaLabel?: string | null;
  headerCtaUrl?: string | null;
  footerDescription?: string | null;
  newsletterTitle?: string | null;
  newsletterText?: string | null;
  copyright?: string | null;
  defaultSeoTitle?: string | null;
  defaultSeoDescription?: string | null;
  siteUrl?: string | null;
  homepageSeoTitle?: string | null;
  homepageSeoDescription?: string | null;
  homepageCanonicalUrl?: string | null;
  homepageOgTitle?: string | null;
  homepageOgDescription?: string | null;
  homepageOgImage?: string | null;
  homepageRobotsIndex?: boolean;
  homepageRobotsFollow?: boolean;
  homepageSchemaEnabled?: boolean;
  googleSiteVerification?: string | null;
  bingSiteVerification?: string | null;
  socialMedia?: Record<string, unknown> | null;
  analyticsIds?: Record<string, unknown> | null;
};

export type NavItem = { id: string; label: string; url: string; children?: NavItem[] };

export type Store = SeoFields & {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  color?: string | null;
  description?: string | null;
  editorialNotes?: string | null;
  shoppingTips?: string[];
  faqItems?: FaqItem[] | null;
  websiteUrl?: string | null;
  updatedAt?: string;
};

export type Brand = SeoFields & {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  description?: string | null;
  updatedAt?: string;
};

export type Category = SeoFields & {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  icon?: string | null;
  description?: string | null;
  h1?: string | null;
  editorialContent?: string | null;
  buyingTips?: string[];
  faqItems?: FaqItem[] | null;
  parent?: Category | null;
  children?: Category[];
  updatedAt?: string;
};

export type ProductImage = { id?: string; url: string; altText?: string | null; sortOrder?: number };
export type Deal = SeoFields & {
  id: string;
  slug: string;
  discountPercent?: number | null;
  badge?: string | null;
  startsAt: string;
  endsAt: string;
  status: Status;
};

export type Product = SeoFields & {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  shortDescription?: string | null;
  editorialSummary?: string | null;
  idealFor?: string | null;
  notIdealFor?: string | null;
  importantSpecs?: Record<string, unknown> | Array<Record<string, unknown>> | null;
  comparisonNotes?: string | null;
  dealAnalysis?: string | null;
  alternativesNotes?: string | null;
  whatWeLike?: string | null;
  whatCouldBeBetter?: string | null;
  bestUseCases?: string[];
  keyFeatures?: string[];
  pros?: string[];
  cons?: string[];
  whyRecommend?: string | null;
  bestFor?: string | null;
  buyingAdvice?: string | null;
  faqItems?: FaqItem[] | null;
  tags?: string[];
  currentPrice?: number | string | null;
  oldPrice?: number | string | null;
  discountPercent?: number | null;
  rating?: number | string | null;
  reviewCount?: number;
  affiliateUrl?: string | null;
  ctaLabel?: string | null;
  badge?: string | null;
  sku?: string | null;
  availability?: string | null;
  status?: Status;
  image?: string | null;
  images?: ProductImage[];
  category?: Category | null;
  brand?: Brand | null;
  store?: Store | null;
  activeDeal?: Deal | null;
  lastVerifiedAt?: string | null;
  priceUpdatedAt?: string | null;
  contentUpdatedAt?: string | null;
  updatedAt?: string;
};

export type Author = {
  id: string;
  name: string;
  slug: string;
  bio?: string | null;
  profileImage?: string | null;
  expertise?: string[];
  profileUrls?: string[];
  updatedAt?: string;
};

export type BlogPost = SeoFields & {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  content?: string;
  coverImage?: string | null;
  publishedAt?: string | null;
  contentUpdatedAt?: string | null;
  updatedAt?: string;
  readingTime?: number | null;
  category?: { id?: string; name: string; slug?: string } | null;
  author?: string | null;
  authorProfile?: Author | null;
  faqItems?: FaqItem[] | null;
};

export type BuyingGuide = SeoFields & {
  id: string;
  slug: string;
  title: string;
  intro: string;
  body?: string | null;
  editorialSections?: unknown;
  heroImage?: string | null;
  heroImageAlt?: string | null;
  faqItems?: FaqItem[] | null;
  status?: Status;
  publishedAt?: string | null;
  updatedAt?: string;
  category?: Category | null;
  author?: Author | null;
  products?: Product[];
};

export type Comparison = SeoFields & {
  id: string;
  slug: string;
  title: string;
  introduction: string;
  comparisonTable?: unknown;
  strengths?: unknown;
  weaknesses?: unknown;
  pricingNotes?: string | null;
  bestFor?: string | null;
  verdict?: string | null;
  faqItems?: FaqItem[] | null;
  heroImage?: string | null;
  heroImageAlt?: string | null;
  publishedAt?: string | null;
  updatedAt?: string;
  author?: Author | null;
  products?: Product[];
  stores?: Store[];
};

export type HomepageSection = {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  background?: string;
  ctaText?: string;
  ctaUrl?: string;
  config?: Record<string, unknown>;
  products?: Product[];
  categories?: Category[];
  stores?: Store[];
  posts?: BlogPost[];
};

export type FooterData = {
  description?: string;
  newsletterText?: string;
  copyrightText?: string;
  socialLinks?: NavItem[];
  legalLinks?: NavItem[];
  columns?: { id: string; title: string; links?: NavItem[] }[];
};
