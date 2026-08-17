import assert from "node:assert/strict";
import test from "node:test";

const base = (process.env.WEB_TEST_URL || "http://localhost:3000").replace(/\/$/, "");

async function get(path) {
  const response = await fetch(`${base}${path}`, { headers: { accept: "text/html" } });
  const body = await response.text();
  return { response, body };
}

function h1Count(html) {
  return (html.match(/<h1\b/gi) || []).length;
}

function parseJsonLd(html, path) {
  const blocks = [...html.matchAll(/<script(?=[^>]*type=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.ok(blocks.length > 0, `${path}: JSON-LD is present`);
  return blocks.map((block) => {
    assert.doesNotThrow(() => JSON.parse(block[1]), `${path}: JSON-LD parses`);
    return JSON.parse(block[1]);
  });
}

function assertSeoDocument(html, path) {
  assert.match(html, /<html[^>]*\blang=["']en-US["']/i, `${path}: en-US html language`);
  assert.match(html, /<title>[^<]+<\/title>/i, `${path}: title`);
  assert.match(html, /<meta(?=[^>]*\bname=["']description["'])(?=[^>]*\bcontent=["'][^"']+)[^>]*>/i, `${path}: description`);
  assert.match(html, /<link(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["'][^"']+)[^>]*>/i, `${path}: canonical`);
  assert.equal(h1Count(html), 1, `${path}: exactly one H1`);
  parseJsonLd(html, path);
}

test("homepage sends meaningful SEO HTML", async () => {
  const { response, body } = await get("/");
  assert.equal(response.status, 200);
  assertSeoDocument(body, "/");
  assert.match(body, /property=["']og:locale["'][^>]*content=["']en_US["']|content=["']en_US["'][^>]*property=["']og:locale["']/i);
  assert.match(body, /"@type":"WebSite"/);
  assert.match(body, /"@type":"Organization"/);
  assert.match(body, /href=["']\/product\//i);
  assert.match(body, /Affiliate disclosure:/i);
  assert.doesNotMatch(body, /noindex/i);
});

test("category HTML contains editorial content, crawlable links, and matching schema", async () => {
  const { response, body } = await get("/category/electronics");
  assert.equal(response.status, 200);
  assertSeoDocument(body, "/category/electronics");
  assert.match(body, /About Electronics Deals|Buying Tips/i);
  assert.match(body, /href=["']\/product\//i);
  assert.match(body, /"@type":"BreadcrumbList"/);
  assert.match(body, /"@type":"ItemList"/);
});

test("unsupported category facets are noindex and canonicalized", async () => {
  const { response, body } = await get("/category/electronics?sort=price&store=amazon");
  assert.equal(response.status, 200);
  assert.match(body, /<meta(?=[^>]*\bname=["']robots["'])(?=[^>]*\bcontent=["'][^"']*noindex)[^>]*>/i);
  assert.match(body, /<link(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["'][^"']*\/category\/electronics["'])[^>]*>/i);
});

test("product HTML is editorial, disclosed, linked, and safe for demo data", async () => {
  const { response, body } = await get("/product/sony-wh-ch720n-wireless-headphones");
  assert.equal(response.status, 200);
  assertSeoDocument(body, "/product/sony-wh-ch720n-wireless-headphones");
  assert.match(body, /Product Overview/i);
  assert.match(body, /Who This Product Is For/i);
  assert.match(body, /What Could Be Better/i);
  assert.match(body, /Frequently Asked Questions/i);
  assert.match(body, /href=["']\/category\/electronics["']/i);
  assert.match(body, /href=["']\/brand\/sony["']/i);
  assert.match(body, /href=["']\/store\/amazon["']/i);
  assert.match(body, /rel=["'][^"']*sponsored[^"']*["']/i);
  assert.match(body, /Demo data/i);
  assert.match(body, /<meta(?=[^>]*\bname=["']robots["'])(?=[^>]*\bcontent=["'][^"']*noindex)[^>]*>/i);
  assert.doesNotMatch(body, /"seller"\s*:/i);
  assert.doesNotMatch(body, /We tested this product/i);
});

test("guide, comparison, blog, and trust routes render substantive server HTML", async () => {
  const routes = [
    ["/guides/best-headphones-for-travel", /Products in this guide/i],
    ["/compare/amazon-vs-walmart", /At a glance/i],
    ["/blog/questions-to-ask-before-following-an-online-deal", /Written by/i],
    ["/affiliate-disclosure", /not the merchant of record/i],
  ];

  for (const [path, expected] of routes) {
    const { response, body } = await get(path);
    assert.equal(response.status, 200, path);
    assertSeoDocument(body, path);
    assert.match(body, /class=["'][^"']*breadcrumbs/i, `${path}: visible breadcrumbs`);
    assert.doesNotMatch(body, /"@type":"BreadcrumbList"/i, `${path}: entity schema is disabled for demo content`);
    assert.match(body, expected, path);
  }
});

test("out-of-range editorial pagination returns 404 instead of creating crawl traps", async () => {
  for (const path of ["/guides?page=999999", "/blog?page=999999", "/compare?page=999999"]) {
    const { response } = await get(path);
    assert.equal(response.status, 404, path);
  }
});

test("search results are deliberately noindex", async () => {
  const { response, body } = await get("/search?q=headphones");
  assert.equal(response.status, 200);
  assertSeoDocument(body, "/search");
  assert.match(body, /<meta(?=[^>]*\bname=["']robots["'])(?=[^>]*\bcontent=["'][^"']*noindex)[^>]*>/i);
  assert.match(body, /href=["']\/product\//i);
});

test("robots and sitemap expose only intended public URLs", async () => {
  const robots = await fetch(`${base}/robots.txt`);
  assert.equal(robots.status, 200);
  const robotsText = await robots.text();
  assert.match(robotsText, /Allow:\s*\//i);
  assert.match(robotsText, /Disallow:\s*\/admin/i);
  assert.match(robotsText, /Sitemap:\s*https?:\/\/[^\s]+\/sitemap\.xml/i);

  const sitemap = await fetch(`${base}/sitemap.xml`);
  assert.equal(sitemap.status, 200);
  const sitemapText = await sitemap.text();
  assert.match(sitemapText, /<urlset\b/i);
  assert.match(sitemapText, /\/category\/electronics/i);
  assert.match(sitemapText, /\/affiliate-disclosure/i);
  assert.doesNotMatch(sitemapText, /\/admin|\/search\?|sony-wh-ch720n-wireless-headphones|bargain-mom-editorial-team/i);
});

test("rendered public navigation contains no broken internal links", async () => {
  const queue = ["/", "/categories", "/stores", "/brands", "/guides", "/compare", "/blog", "/deals"];
  const seen = new Set();
  const failures = [];

  while (queue.length && seen.size < 160) {
    const path = queue.shift();
    if (!path || seen.has(path)) continue;
    seen.add(path);
    const response = await fetch(`${base}${path}`, { headers: { accept: "text/html" } });
    if (response.status >= 400) {
      failures.push(`${path} -> ${response.status}`);
      continue;
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) continue;
    const html = await response.text();
    assertSeoDocument(html, path);
    for (const match of html.matchAll(/\bhref=["']([^"']+)["']/gi)) {
      try {
        const url = new URL(match[1].replaceAll("&amp;", "&"), base);
        if (url.origin !== new URL(base).origin) continue;
        const candidate = url.pathname;
        if (candidate.startsWith("/_next") || candidate.startsWith("/admin") || /\.(?:svg|png|jpe?g|webp|gif|ico|css|js|woff2?)$/i.test(candidate)) continue;
        if (!seen.has(candidate)) queue.push(candidate);
      } catch {
        failures.push(`${path} contains invalid href ${match[1]}`);
      }
    }
  }

  assert.ok(seen.size >= 50, `expected broad link coverage, crawled ${seen.size} URLs`);
  assert.deepEqual(failures, []);
});
