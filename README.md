# Bargain MOM affiliate project

Bargain MOM is a database-first affiliate editorial and deals platform for U.S. shoppers. It keeps the existing architecture intact:

`Admin Dashboard → Express API → Prisma → PostgreSQL → Next.js public frontend`

The site links shoppers to external retailers; it is not the merchant of record and does not process product orders.

## Local setup

1. Copy `.env.example` to `.env` and configure PostgreSQL, a strong JWT secret, and the initial admin account.
2. Install dependencies with `npm install`.
3. Generate Prisma Client with `npm run db:generate`.
4. Apply the database schema with `npx prisma migrate deploy` (or `npm run db:push` for disposable local development only).
5. Create the configured admin with `npm run db:seed`.
6. Optionally add the clearly labeled, non-indexable demo catalog with `npm run db:seed:demo`.
7. Start the frontend and API with `npm run dev:all`.

The storefront runs at `http://localhost:3000`, the Express API at `http://localhost:4000`, and the admin dashboard at `http://localhost:3000/admin`.

### Existing databases created with `prisma db push`

The repository now has a complete migration history for clean installations. If an existing production database was originally created with `prisma db push`, back it up first, then mark only the schema it already contains as applied before deploying the SEO migration:

```bash
npx prisma migrate resolve --applied 00000000000000_baseline
npx prisma migrate resolve --applied 20260817160000_product_editorial_fields
npx prisma migrate deploy
```

The second resolve command is appropriate when the existing `Product` table already contains `keyFeatures`, `pros`, `cons`, `whyRecommend`, `bestFor`, and `buyingAdvice` (the current project database does). Do not resolve a migration whose columns are absent; apply it normally instead. Fresh databases should run only `npx prisma migrate deploy`.

## SEO and editorial features

- `en-US`, USD, U.S. date formatting, `en_US` Open Graph locale
- CMS-managed SEO titles, descriptions, canonicals, Open Graph data, robots controls, and schema toggles
- Editorial product fields, FAQs, freshness timestamps, and honest deal-expiration behavior
- Dynamic buying guides, comparisons, authors, category/store/brand pages, blog articles, and trust pages
- Server-rendered content, crawlable anchors and pagination, matching breadcrumb UI/JSON-LD
- Accurate Organization, WebSite, Product, Offer, Article, BlogPosting, ItemList, and BreadcrumbList data where enabled
- Dynamic `/sitemap.xml` and `/robots.txt`
- Canonical/noindex handling for search, filters, tracking parameters, and low-value URL combinations
- Responsive images with explicit dimensions and priority only for likely LCP media
- GA4 or Google Tag Manager support plus non-sensitive affiliate click attribution
- A non-blocking SEO audit inside the admin dashboard

Search Console verification tokens, the canonical site URL, homepage metadata, analytics IDs, and affiliate disclosure can be updated under Admin → Settings.

## Content safety

The optional demo products, prices, ratings, guides, comparisons, and articles are visibly identified as demonstrations and are seeded with `robotsIndex=false` and `schemaEnabled=false`. Deal rows are inactive. Editors should verify exact product specifications, price, availability, retailer terms, authorship, and source material before enabling indexing or structured data.

## Verification

- `npm run typecheck:api` — Express, Prisma admin API, and seed type checking
- `npm run build` — production frontend build
- `npm run test:admin-crud` — authenticated PostgreSQL CRUD and relationship checks (requires the API)
- `npm run test:rendered` — real rendered-HTML SEO checks (requires seeded API and frontend)

For production, configure `SITE_URL`/`NEXT_PUBLIC_SITE_URL` with the public HTTPS origin and `API_URL`/`NEXT_PUBLIC_API_URL` with the deployed Express API. The frontend should not be published before the production PostgreSQL-backed API is reachable.
