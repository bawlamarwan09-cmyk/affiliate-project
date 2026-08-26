import assert from "node:assert/strict";

const base = process.env.API_TEST_URL || "http://localhost:4000/api";
let cookie = "";

async function request(path, method = "GET", body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body instanceof FormData ? {} : { "content-type": "application/json" }),
      ...(cookie ? { cookie } : {}),
    },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  const payload = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    throw new Error(`${method} ${path} -> ${response.status}: ${JSON.stringify(payload)}`);
  }
  return payload?.data ?? payload;
}

function orderPayload(resource, row) {
  if (resource === "homepage-sections") {
    return {
      ...row,
      productIds: (row.products || []).map((item) => item.productId),
      categoryIds: (row.categories || []).map((item) => item.categoryId),
      storeIds: (row.stores || []).map((item) => item.storeId),
    };
  }
  if (resource === "footer") {
    return { ...row, links: Array.isArray(row.links) ? row.links : [] };
  }
  return row;
}

const login = await request("/auth/login", "POST", {
  email: "admin@example.com",
  password: "LocalTestPass123",
});
assert.equal(login.admin.email, "admin@example.com");
assert.equal((await request("/auth/session")).admin.id, login.admin.id);

const originalSettings = await request("/admin/settings");
assert(originalSettings, "Global site settings must exist before the CRUD suite runs");
const orderedResources = ["homepage-sections", "navigation", "footer"];
const originalOrdering = Object.fromEntries(
  await Promise.all(
    orderedResources.map(async (resource) => [
      resource,
      (await request(`/admin/${resource}`)).map((row) => ({ ...row })),
    ]),
  ),
);

const created = [];
const suffix = Date.now().toString(36);
let testError;
const cleanupErrors = [];

try {
  const store = await request("/admin/stores", "POST", {
    name: `CRUD Test Store ${suffix}`,
    slug: `crud-test-store-${suffix}`,
    description: "Temporary verification record",
    websiteUrl: "https://example.com",
    affiliateBaseUrl: "https://example.com/go",
    color: "#ff5a0a",
    active: true,
  });
  created.push(["stores", store.id]);

  const category = await request("/admin/categories", "POST", {
    name: `CRUD Test Category ${suffix}`,
    slug: `crud-test-category-${suffix}`,
    description: "Temporary verification record",
    sortOrder: 99,
    status: "ACTIVE",
  });
  created.push(["categories", category.id]);

  const brand = await request("/admin/brands", "POST", {
    name: `CRUD Test Brand ${suffix}`,
    slug: `crud-test-brand-${suffix}`,
    description: "Temporary verification record",
    active: true,
  });
  created.push(["brands", brand.id]);

  const options = await request("/admin/options");
  assert(options.stores.some((item) => item.id === store.id));
  assert(options.categories.some((item) => item.id === category.id));
  assert(options.brands.some((item) => item.id === brand.id));

  let product = await request("/admin/products", "POST", {
    title: `CRUD Test Product ${suffix}`,
    slug: `crud-test-product-${suffix}`,
    description: "Temporary end-to-end verification product",
    shortDescription: "Temporary product",
    currentPrice: 79.99,
    oldPrice: 99.99,
    discountPercent: 20,
    rating: 4.7,
    reviewCount: 123,
    affiliateUrl: "https://example.com/deal",
    ctaLabel: "View Deal",
    badge: "Test",
    sku: `TEST-${suffix}`,
    availability: "In stock",
    tags: ["test"],
    status: "ACTIVE",
    featured: false,
    robotsIndex: false,
    robotsFollow: true,
    schemaEnabled: false,
    categoryId: category.id,
    brandId: brand.id,
    storeId: store.id,
    images: [],
  });
  created.push(["products", product.id]);
  product = await request(`/admin/products/${product.id}`, "PATCH", {
    ...product,
    title: `CRUD Test Product Updated ${suffix}`,
    currentPrice: 74.99,
    featured: true,
    images: [],
  });
  assert.equal(product.featured, true);
  await request(`/admin/products/${product.id}/toggle`, "POST", { active: false });
  await request(`/admin/products/${product.id}/toggle`, "POST", { active: true });

  const deal = await request("/admin/deals", "POST", {
    slug: `crud-test-deal-${suffix}`,
    productId: product.id,
    discountPercent: 25,
    startsAt: new Date(Date.now() - 60_000),
    endsAt: new Date(Date.now() + 86_400_000),
    badge: "Hot Deal",
    featured: true,
    status: "ACTIVE",
  });
  created.push(["deals", deal.id]);

  const banner = await request("/admin/banners", "POST", {
    title: `CRUD Verification Offer ${suffix}`,
    subtitle: "Temporary banner",
    background: "#071225",
    buttonLabel: "See offer",
    buttonUrl: `/store/${store.slug}`,
    storeId: store.id,
    sortOrder: 4,
    status: "ACTIVE",
  });
  created.push(["banners", banner.id]);
  assert.equal(banner.buttonUrl, `/store/${store.slug}`);

  const author = await request("/admin/authors", "POST", {
    name: `CRUD Test Author ${suffix}`,
    slug: `crud-test-author-${suffix}`,
    bio: "Temporary editorial profile used only by the automated PostgreSQL CRUD verification suite.",
    expertise: ["Test fixtures"],
    profileUrls: [],
    active: true,
  });
  created.push(["authors", author.id]);

  let guide = await request("/admin/guides", "POST", {
    title: `CRUD Test Buying Guide ${suffix}`,
    slug: `crud-test-buying-guide-${suffix}`,
    intro: "This temporary guide verifies selected-product persistence through the complete admin API.",
    body: "Temporary test content only.",
    editorialSections: [{ heading: "What this verifies", body: "The guide remains connected to its selected PostgreSQL product." }],
    faqItems: [],
    productIds: [product.id],
    categoryId: category.id,
    authorId: author.id,
    status: "ACTIVE",
    publishedAt: new Date(),
    robotsIndex: false,
    robotsFollow: true,
    schemaEnabled: false,
  });
  created.push(["guides", guide.id]);
  assert.equal(guide.products[0].productId, product.id);
  guide = await request(`/admin/guides/${guide.id}`, "PATCH", { ...guide, productIds: [] });
  assert.equal(guide.products.length, 0);
  guide = await request(`/admin/guides/${guide.id}`, "PATCH", { ...guide, productIds: [product.id] });
  assert.equal(guide.products[0].productId, product.id);

  let comparison = await request("/admin/comparisons", "POST", {
    title: `CRUD Product and Store Comparison ${suffix}`,
    slug: `crud-product-store-comparison-${suffix}`,
    introduction: "This temporary comparison verifies manually selected products and stores through the admin API.",
    comparisonTable: [{ label: "Test criterion", values: ["Product value", "Store value"] }],
    strengths: { Product: ["Temporary strength"] },
    weaknesses: { Product: ["Temporary limitation"] },
    pricingNotes: "No pricing claim is made by this temporary test record.",
    bestFor: "Automated persistence verification.",
    verdict: "The test passes when relationships persist.",
    faqItems: [],
    productIds: [product.id],
    storeIds: [store.id],
    authorId: author.id,
    status: "ACTIVE",
    publishedAt: new Date(),
    robotsIndex: false,
    robotsFollow: true,
    schemaEnabled: false,
  });
  created.push(["comparisons", comparison.id]);
  assert.equal(comparison.products[0].productId, product.id);
  assert.equal(comparison.stores[0].storeId, store.id);
  comparison = await request(`/admin/comparisons/${comparison.id}`, "PATCH", { ...comparison, productIds: [], storeIds: [] });
  assert.equal(comparison.products.length, 0);
  assert.equal(comparison.stores.length, 0);
  comparison = await request(`/admin/comparisons/${comparison.id}`, "PATCH", { ...comparison, productIds: [product.id], storeIds: [store.id] });
  assert.equal(comparison.products[0].productId, product.id);
  assert.equal(comparison.stores[0].storeId, store.id);

  const page = await request("/admin/pages", "POST", {
    title: `CRUD Trust Page ${suffix}`,
    slug: `crud-trust-page-${suffix}`,
    intro: "Temporary trust-page introduction.",
    content: "This temporary trust page verifies CMS persistence and is removed when the suite finishes.",
    status: "ACTIVE",
    publishedAt: new Date(),
    robotsIndex: false,
    robotsFollow: true,
    schemaEnabled: false,
  });
  created.push(["pages", page.id]);

  let post = await request("/admin/blog", "POST", {
    title: `CRUD Verification Article ${suffix}`,
    slug: `crud-verification-article-${suffix}`,
    excerpt: "Temporary verification post",
    content: "This temporary article verifies persistence and contextual internal-link relationships.",
    authorId: author.id,
    productIds: [product.id],
    guideIds: [guide.id],
    commerceCategoryIds: [category.id],
    faqItems: [],
    tags: ["test"],
    status: "ACTIVE",
    publishedAt: new Date(),
    readingTime: 3,
    robotsIndex: false,
    robotsFollow: true,
    schemaEnabled: false,
  });
  created.push(["blog", post.id]);
  assert.equal(post.productPlacements[0].productId, product.id);
  assert.equal(post.guidePlacements[0].guideId, guide.id);
  assert.equal(post.commerceCategoryPlacements[0].categoryId, category.id);
  post = await request(`/admin/blog/${post.id}`, "PATCH", { ...post, productIds: [], guideIds: [], commerceCategoryIds: [] });
  assert.equal(post.productPlacements.length, 0);
  assert.equal(post.guidePlacements.length, 0);
  assert.equal(post.commerceCategoryPlacements.length, 0);
  post = await request(`/admin/blog/${post.id}`, "PATCH", { ...post, productIds: [product.id], guideIds: [guide.id], commerceCategoryIds: [category.id] });
  assert.equal(post.productPlacements[0].productId, product.id);

  const section = await request("/admin/homepage-sections", "POST", {
    type: "FEATURED_PRODUCTS",
    title: `CRUD Verification Deals ${suffix}`,
    sortOrder: 1_000_000,
    visible: true,
    productIds: [product.id],
    categoryIds: [],
    storeIds: [],
    config: {},
  });
  created.push(["homepage-sections", section.id]);
  const blogSection = await request("/admin/homepage-sections", "POST", {
    type: "BLOG",
    title: `CRUD Verification Blog ${suffix}`,
    sortOrder: 1_000_001,
    visible: true,
    productIds: [],
    categoryIds: [],
    storeIds: [],
    config: {},
  });
  created.push(["homepage-sections", blogSection.id]);
  assert.equal((await request(`/admin/homepage-sections/${blogSection.id}/move`, "POST", { direction: "up" })).moved, true);

  const nav = await request("/admin/navigation", "POST", { label: `CRUD Test ${suffix}`, url: `/crud-test-${suffix}`, sortOrder: 99, active: true });
  created.push(["navigation", nav.id]);
  const footer = await request("/admin/footer", "POST", { title: `CRUD Test Links ${suffix}`, content: "Temporary", sortOrder: 99, active: true, links: [{ label: "Test", url: `/crud-test-${suffix}` }] });
  created.push(["footer", footer.id]);
  const affiliate = await request("/admin/affiliate-links", "POST", { label: `CRUD Test Affiliate ${suffix}`, url: "https://example.com/affiliate", productId: product.id, clickCount: 0, active: true });
  created.push(["affiliate-links", affiliate.id]);
  const secondAdmin = await request("/admin/admins", "POST", { name: `CRUD Test Editor ${suffix}`, email: `crud-editor-${suffix}@example.com`, password: "TemporaryPass123", role: "EDITOR", active: true });
  created.push(["admins", secondAdmin.id]);

  const settings = await request("/admin/settings", "PUT", {
    ...originalSettings,
    websiteName: "Bargain MOM Test",
    supportEmail: null,
  });
  assert.equal(settings.websiteName, "Bargain MOM Test");
  assert.equal(settings.supportEmail, null);

  let homepage = await request("/homepage");
  assert(homepage.sections.some((item) => item.title === section.title));
  assert(homepage.sections.some((item) => item.title === banner.title));
  assert(homepage.sections.some((item) => item.posts?.some((item) => item.slug === post.slug)));
  assert(homepage.sections.find((item) => item.title === section.title).products.some((item) => item.id === product.id));

  await request(`/admin/deals/${deal.id}/toggle`, "POST", { active: false });
  const expiredDeal = await request("/admin/deals", "POST", {
    slug: `crud-test-expired-deal-${suffix}`,
    productId: product.id,
    discountPercent: 40,
    startsAt: new Date(Date.now() - 172_800_000),
    endsAt: new Date(Date.now() - 86_400_000),
    badge: "Expired Deal",
    featured: true,
    status: "ACTIVE",
  });
  created.push(["deals", expiredDeal.id]);
  const expiredProduct = await request(`/products/${product.slug}`);
  assert.equal(expiredProduct.activeDeal, null);
  assert.equal(expiredProduct.discountPercent, null);
  assert.equal(expiredProduct.oldPrice, null);
  assert.equal(expiredProduct.badge, null);
  assert(!(await request("/deals")).some((item) => item.id === expiredDeal.id));
  homepage = await request("/homepage");
  assert(!homepage.sections.find((item) => item.title === section.title).products.some((item) => item.id === product.id));
  assert((await request("/admin/products")).some((item) => item.id === product.id));

  const audit = await request("/admin/seo-audit");
  assert.equal(typeof audit.summary.checked, "number");
  assert(Array.isArray(audit.items));
  assert(audit.items.every((item) => item.warnings.every((warning) => !warning.includes("canonical override"))));
} catch (error) {
  testError = error;
} finally {
  for (const [resource, id] of created.slice().reverse()) {
    try {
      await request(`/admin/${resource}/${id}`, "DELETE");
    } catch (error) {
      cleanupErrors.push(error);
    }
  }

  for (const resource of orderedResources) {
    try {
      const current = await request(`/admin/${resource}`);
      const currentById = new Map(current.map((row) => [row.id, row]));
      for (const original of originalOrdering[resource]) {
        const row = currentById.get(original.id);
        if (row && row.sortOrder !== original.sortOrder) {
          await request(`/admin/${resource}/${original.id}`, "PATCH", orderPayload(resource, { ...row, sortOrder: original.sortOrder }));
        }
      }
    } catch (error) {
      cleanupErrors.push(error);
    }
  }

  try {
    await request("/admin/settings", "PUT", originalSettings);
  } catch (error) {
    cleanupErrors.push(error);
  }
}

if (testError || cleanupErrors.length) {
  throw new AggregateError(
    [testError, ...cleanupErrors].filter(Boolean),
    "The admin CRUD suite or its state restoration failed",
  );
}

console.log("Authenticated PostgreSQL CRUD suite passed; temporary records, settings, and ordering were restored.");
