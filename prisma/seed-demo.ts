import "dotenv/config";
import { Prisma, PrismaClient, SectionType } from "@prisma/client";
import { howtoPageSeed } from "./howto-page-data.js";

const prisma = new PrismaClient();
const CONTENT_DATE = new Date("2026-08-17T12:00:00.000Z");
const DEMO_SEED_RUN = new Date();
const DEMO_DEAL_START = new Date(DEMO_SEED_RUN.getTime() - 24 * 60 * 60 * 1000);
const DEMO_DEAL_END = new Date(DEMO_SEED_RUN.getTime() + 30 * 24 * 60 * 60 * 1000);

const image = (id: string) =>
  id.startsWith("http")
    ? id
    : `https://images.unsplash.com/${id}?auto=format&fit=crop&w=700&h=560&q=82`;
const logo = (name: string, color = "071225") =>
  `https://placehold.co/260x90/ffffff/${color}?text=${encodeURIComponent(name)}`;
const json = (value: unknown) => value as Prisma.InputJsonValue;
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const retailerSearchUrl = (store: string, title: string) => {
  const query = encodeURIComponent(title);
  if (store === "amazon") return `https://www.amazon.com/s?k=${query}`;
  if (store === "walmart") return `https://www.walmart.com/search?q=${query}`;
  if (store === "target") return `https://www.target.com/s?searchTerm=${query}`;
  if (store === "ebay") return `https://www.ebay.com/sch/i.html?_nkw=${query}`;
  return `https://www.bestbuy.com/site/searchpage.jsp?st=${query}`;
};
const retailerLabel = (store: string) => storeSeed.find((item) => item.slug === store)?.name || "the retailer";

const affiliateDisclosure =
  "Bargain MOM may earn a commission when you buy through links on this site, at no additional cost to you. Retailers set their own prices, availability, shipping, and return terms.";
const socialMedia = {
  x: "https://x.com/Bargainmomfinds",
  pinterest: "https://www.pinterest.com/BargainMomFinds/",
  facebook: "https://www.facebook.com/BargainMomFinds",
  telegram: "https://t.me/+gg_SXlyZR7ZhNjA0",
  instagram: "https://www.instagram.com/bargainmomfinds/",
  tiktok: "https://www.tiktok.com/@bargainmomfinds",
};
const announcementItems = [
  "Independent shopping research for U.S. shoppers",
  "Clear affiliate disclosures on every recommendation",
  "Product comparisons and practical buying guides",
  "Retailer links for your next smart purchase",
];

await prisma.siteSettings.upsert({
  where: { id: "global" },
  update: {
    websiteName: "Bargain MOM",
    logo: "/brand/bargain-mom-logo.webp",
    defaultSeoTitle: "Bargain MOM | Practical Deal Research for U.S. Shoppers",
    defaultSeoDescription:
      "Compare product details, shopping guidance, and retailer offers with clear affiliate disclosure.",
    homepageSeoTitle: "Bargain MOM | Deals, Comparisons, and Buying Guides",
    homepageSeoDescription:
      "Research products, compare retailer offers, and read practical buying guides created for U.S. shoppers.",
    homepageRobotsIndex: true,
    homepageRobotsFollow: true,
    homepageSchemaEnabled: true,
    socialMedia: json(socialMedia),
    announcementItems: json(announcementItems),
    affiliateDisclosure,
    copyright: "© Bargain MOM. Product names and trademarks belong to their respective owners.",
    searchPlaceholder: "Search products, brands, stores, or categories...",
    headerCtaLabel: "Browse Deals",
    headerCtaUrl: "/deals",
    footerDescription:
      "Independent shopping research, product context, and clearly disclosed links to external retailers.",
    newsletterTitle: "Shopping notes",
    newsletterText: "Get new guides and deal research when they are published.",
  },
  create: {
    id: "global",
    websiteName: "Bargain MOM",
    logo: "/brand/bargain-mom-logo.webp",
    defaultSeoTitle: "Bargain MOM | Practical Deal Research for U.S. Shoppers",
    defaultSeoDescription:
      "Compare product details, shopping guidance, and retailer offers with clear affiliate disclosure.",
    homepageSeoTitle: "Bargain MOM | Deals, Comparisons, and Buying Guides",
    homepageSeoDescription:
      "Research products, compare retailer offers, and read practical buying guides created for U.S. shoppers.",
    socialMedia: json(socialMedia),
    announcementItems: json(announcementItems),
    affiliateDisclosure,
    copyright: "© Bargain MOM. Product names and trademarks belong to their respective owners.",
    searchPlaceholder: "Search products, brands, stores, or categories...",
    headerCtaLabel: "Browse Deals",
    headerCtaUrl: "/deals",
    footerDescription:
      "Independent shopping research, product context, and clearly disclosed links to external retailers.",
    newsletterTitle: "Shopping notes",
    newsletterText: "Get new guides and deal research when they are published.",
  },
});

const storeSeed = [
  {
    name: "Amazon",
    slug: "amazon",
    description:
      "Research products currently associated with Amazon in this catalog, then confirm the final offer on the retailer's website.",
    editorialNotes:
      "Amazon listings can differ by seller, condition, delivery promise, and return policy. Compare the exact listing rather than relying on the headline price alone.",
    shoppingTips: [
      "Check who sells and fulfills the item.",
      "Compare delivery dates and return eligibility before checkout.",
      "Review model numbers when several similar versions share a listing.",
    ],
    faqItems: json([
      {
        question: "Does Bargain MOM sell Amazon products?",
        answer: "No. Bargain MOM is an editorial affiliate site. Purchases take place on Amazon or another external retailer.",
      },
      {
        question: "Can an Amazon price change after I leave this page?",
        answer: "Yes. The retailer controls price, availability, shipping, and seller terms, so confirm all details before buying.",
      },
      {
        question: "What should I compare between similar Amazon listings?",
        answer: "Check the exact model, item condition, seller, fulfillment method, warranty information, and return window.",
      },
    ]),
    logo: logo("amazon", "ff9900"),
    websiteUrl: "https://www.amazon.com",
    color: "#ff9900",
    seoTitle: "Amazon Product Research and Shopping Tips | Bargain MOM",
    seoDescription: "Browse cataloged Amazon products and learn what to check before following an offer to the retailer.",
  },
  {
    name: "Walmart",
    slug: "walmart",
    description:
      "Browse Walmart-linked catalog items with practical context for comparing everyday products and household purchases.",
    editorialNotes:
      "Walmart offers can vary between shipping, pickup, local inventory, and marketplace sellers. Confirm the fulfillment method shown for your ZIP code.",
    shoppingTips: [
      "Compare shipping, pickup, and delivery options for your location.",
      "Check whether Walmart or a marketplace seller is fulfilling the order.",
      "Read the return terms for the exact item and seller.",
    ],
    faqItems: json([
      {
        question: "Are Walmart offers fulfilled the same way everywhere?",
        answer: "No. Inventory, pickup, delivery, and shipping options can vary by location and listing.",
      },
      {
        question: "Who completes a purchase linked from Bargain MOM?",
        answer: "The purchase is completed on Walmart's website or app. Bargain MOM does not process the order.",
      },
      {
        question: "Why should I check the seller name?",
        answer: "Some listings may be offered by marketplace sellers with their own shipping and return terms.",
      },
    ]),
    logo: logo("Walmart", "1769c2"),
    websiteUrl: "https://www.walmart.com",
    color: "#1769c2",
    seoTitle: "Walmart Product Research and Shopping Tips | Bargain MOM",
    seoDescription: "Explore Walmart-linked product records and practical guidance for comparing fulfillment and return terms.",
  },
  {
    name: "Target",
    slug: "target",
    description:
      "Explore Target-linked products across home, beauty, family, and technology categories with independent shopping notes.",
    editorialNotes:
      "Before purchasing, verify the exact size, color, model, pickup availability, and any offer conditions shown by Target.",
    shoppingTips: [
      "Confirm that the selected color, size, or model matches the displayed offer.",
      "Check pickup inventory separately from shipping availability.",
      "Review exclusions and end dates on retailer promotions.",
    ],
    faqItems: json([
      {
        question: "Does a Target offer apply to every product variation?",
        answer: "Not always. Price and availability can differ by size, color, model, and fulfillment option.",
      },
      {
        question: "Are Target pickup estimates guaranteed by Bargain MOM?",
        answer: "No. Target controls local inventory and fulfillment estimates; confirm them on the retailer page.",
      },
      {
        question: "Are outbound Target links affiliate links?",
        answer: "A link may be an affiliate link. The page disclosure identifies how Bargain MOM may earn a commission.",
      },
    ]),
    logo: logo("Target", "cc0000"),
    websiteUrl: "https://www.target.com",
    color: "#cc0000",
    seoTitle: "Target Product Research and Shopping Tips | Bargain MOM",
    seoDescription: "Browse Target-linked products with reminders about variations, pickup, shipping, and offer conditions.",
  },
  {
    name: "eBay",
    slug: "ebay",
    description:
      "Review eBay-linked catalog items while accounting for condition, seller history, shipping, and listing-specific details.",
    editorialNotes:
      "Marketplace listings are not interchangeable. Condition, included accessories, seller policies, and listing formats can materially affect value.",
    shoppingTips: [
      "Read the condition description and included-item list carefully.",
      "Review seller feedback and return terms.",
      "Include shipping charges when comparing the total cost.",
    ],
    faqItems: json([
      {
        question: "Why can two eBay listings have different prices?",
        answer: "Condition, seller, accessories, shipping, return terms, and auction or fixed-price format can all differ.",
      },
      {
        question: "Does Bargain MOM verify individual marketplace sellers?",
        answer: "No. Review the seller information and current listing terms directly on eBay before purchasing.",
      },
      {
        question: "What total should I compare?",
        answer: "Compare the item price together with shipping, taxes, condition, included accessories, and any return costs.",
      },
    ]),
    logo: logo("eBay", "3665f3"),
    websiteUrl: "https://www.ebay.com",
    color: "#3665f3",
    seoTitle: "eBay Listing Research and Shopping Tips | Bargain MOM",
    seoDescription: "Browse eBay-linked items with practical guidance about condition, sellers, shipping, and returns.",
  },
  {
    name: "Best Buy",
    slug: "best-buy",
    description:
      "Compare Best Buy-linked technology and appliance records with notes on model numbers, condition, and fulfillment.",
    editorialNotes:
      "Technology products often have closely related model variants. Confirm the full model number, included accessories, warranty, and whether an item is new or open-box.",
    shoppingTips: [
      "Match the full model number before comparing prices.",
      "Check whether the listing is new, refurbished, or open-box.",
      "Review pickup timing, warranty coverage, and return terms.",
    ],
    faqItems: json([
      {
        question: "Why does the model number matter for electronics?",
        answer: "Similar names can cover products with different sizes, generations, features, or included accessories.",
      },
      {
        question: "Does Bargain MOM provide Best Buy warranties?",
        answer: "No. Any warranty or protection plan is provided under the terms shown by the retailer or manufacturer.",
      },
      {
        question: "Should open-box pricing be compared with new pricing?",
        answer: "Only after checking condition, included parts, warranty coverage, and return eligibility for the exact unit.",
      },
    ]),
    logo: logo("BEST BUY", "0046be"),
    websiteUrl: "https://www.bestbuy.com",
    color: "#0046be",
    seoTitle: "Best Buy Product Research and Shopping Tips | Bargain MOM",
    seoDescription: "Explore Best Buy-linked electronics with guidance on model numbers, condition, pickup, and warranties.",
  },
];

const categorySeed = [
  {
    name: "Electronics",
    slug: "electronics",
    icon: "◉",
    h1: "Electronics Deals and Buying Advice",
    description: "Compare technology products by the features that affect everyday use, compatibility, and long-term value.",
    editorialContent:
      "Start with the job the device needs to do, then compare compatible connections, battery or power requirements, warranty terms, and the exact model generation. A lower price is less useful when a product lacks a required feature or will need immediate replacement.",
    buyingTips: [
      "Confirm the exact model number and generation.",
      "Check compatibility with devices and services you already use.",
      "Compare warranty, return window, and included accessories.",
    ],
    faqItems: [
      { question: "What should I check before buying discounted electronics?", answer: "Verify the model number, condition, compatibility, warranty, included accessories, and return terms." },
      { question: "Is the largest percentage discount always the best value?", answer: "No. Compare the current price with similar models and the features you actually need." },
      { question: "Why are exact model numbers important?", answer: "Retailers may use similar product names for different generations, sizes, or feature sets." },
    ],
  },
  {
    name: "Home",
    slug: "home",
    icon: "▱",
    h1: "Home Product Deals and Practical Buying Tips",
    description: "Research useful home products with attention to space, maintenance, replacement parts, and total ownership cost.",
    editorialContent:
      "A home product should fit both the room and the routine. Consider storage, noise, cleaning requirements, consumables, replacement parts, and whether the product solves a recurring task before comparing headline discounts.",
    buyingTips: [
      "Measure the storage and operating space available.",
      "Include filters, bags, or other consumables in the long-term cost.",
      "Check noise, maintenance, and return requirements.",
    ],
    faqItems: [
      { question: "How should I compare home appliances?", answer: "Compare capacity, dimensions, maintenance, consumables, noise, warranty, and the tasks each model handles." },
      { question: "What is total ownership cost?", answer: "It includes the purchase price plus supplies, replacement parts, energy, and likely maintenance." },
      { question: "Why measure before ordering?", answer: "A product needs enough space for storage, operation, doors, hoses, or charging equipment." },
    ],
  },
  {
    name: "Kitchen",
    slug: "kitchen",
    icon: "▣",
    h1: "Kitchen Deals and Appliance Buying Guides",
    description: "Compare kitchen tools and appliances by capacity, counter space, cleaning effort, and the meals you cook most often.",
    editorialContent:
      "The best kitchen purchase earns its space. Match capacity to household size, check whether removable parts are easy to clean, and avoid paying for programs or accessories that will rarely be used.",
    buyingTips: [
      "Match capacity to household size and typical portions.",
      "Measure counter and cabinet clearance.",
      "Review cleaning steps and dishwasher-safe parts.",
    ],
    faqItems: [
      { question: "How much appliance capacity do I need?", answer: "Use your common meal size and available storage space rather than choosing the largest capacity by default." },
      { question: "Which kitchen features usually matter most?", answer: "Useful capacity, predictable controls, cleaning access, and safe storage often matter more than a long preset list." },
      { question: "Should accessories affect the comparison?", answer: "Yes. Check what is included, what replacements cost, and whether you will realistically use each accessory." },
    ],
  },
  {
    name: "Beauty",
    slug: "beauty",
    icon: "✦",
    h1: "Beauty Deals with Ingredient and Routine Context",
    description: "Compare personal-care products by fit for your routine, ingredients or settings, refill cost, and return limitations.",
    editorialContent:
      "Beauty and personal-care value is personal. Review ingredients, sensitivities, device replacement heads, and how a product fits an existing routine. Avoid buying a larger bundle unless each item will be used within its recommended period.",
    buyingTips: [
      "Review ingredients and sensitivity guidance.",
      "Check refill or replacement-head cost for devices.",
      "Confirm hygiene-related return restrictions.",
    ],
    faqItems: [
      { question: "What should sensitive-skin shoppers check?", answer: "Review the full ingredient list and relevant professional guidance rather than relying on marketing labels alone." },
      { question: "How do I compare personal-care devices?", answer: "Include replacement parts, charging, cleaning, settings, warranty, and ongoing cost." },
      { question: "Are large bundles always better value?", answer: "Only when the products suit your routine and can be used appropriately before they expire." },
    ],
  },
  {
    name: "Fashion",
    slug: "fashion",
    icon: "◇",
    h1: "Fashion Deals with Fit and Material Guidance",
    description: "Evaluate clothing and footwear offers by fit, materials, care, return costs, and realistic cost per wear.",
    editorialContent:
      "A fashion discount only helps when the item fits and gets worn. Compare the brand's current size chart, fabric and care instructions, weather suitability, and return method before deciding.",
    buyingTips: [
      "Use the current brand size chart and recent measurements.",
      "Review material and care instructions.",
      "Include return shipping or restocking costs in the decision.",
    ],
    faqItems: [
      { question: "Why should I recheck a familiar brand's size chart?", answer: "Sizing can differ by product line, cut, and season even within the same brand." },
      { question: "How can I judge value beyond the sale price?", answer: "Consider expected wear, versatility, material, care requirements, and return costs." },
      { question: "What should online shoe shoppers compare?", answer: "Check measurements, width options, intended activity, materials, support, and the return process." },
    ],
  },
  {
    name: "Kids & Toys",
    slug: "kids-toys",
    icon: "★",
    h1: "Kids and Toy Deals with Age and Safety Context",
    description: "Compare toys and children's products by stated age range, supervision needs, durability, storage, and required accessories.",
    editorialContent:
      "Use the manufacturer's age and safety information as the starting point. Then consider how a child will use the item, whether small pieces require supervision, how much storage it needs, and whether batteries or add-ons are required.",
    buyingTips: [
      "Follow manufacturer age and safety guidance.",
      "Check for small parts, batteries, and supervision needs.",
      "Plan for storage and replacement pieces.",
    ],
    faqItems: [
      { question: "What matters more than a toy's popularity?", answer: "Age appropriateness, safety guidance, the child's interests, durability, and manageable storage are more useful filters." },
      { question: "Should batteries and add-ons count toward cost?", answer: "Yes. Include required batteries, subscriptions, refills, or expansion pieces in the total." },
      { question: "Where should I check current safety information?", answer: "Review manufacturer instructions and relevant official recall or safety resources before use." },
    ],
  },
  {
    name: "Sports",
    slug: "sports",
    icon: "◆",
    h1: "Sports and Outdoor Deals by Use Case",
    description: "Compare recreation equipment by fit, conditions, durability, transport, storage, and safety requirements.",
    editorialContent:
      "Choose equipment for the actual activity and conditions. Fit, weight, weather resistance, setup effort, portability, and replacement parts can be more important than a broad list of features.",
    buyingTips: [
      "Choose the correct size and intended activity level.",
      "Account for transport, setup, and storage.",
      "Review safety equipment and weather limitations.",
    ],
    faqItems: [
      { question: "How should beginners choose sports equipment?", answer: "Prioritize correct fit, simple setup, safety guidance, and suitability for the intended activity." },
      { question: "What outdoor specifications matter?", answer: "Weather resistance, packed size, weight, capacity, setup, and temperature or terrain limits can matter." },
      { question: "Should replacement parts affect value?", answer: "Yes. Availability and cost of commonly worn or lost parts can affect long-term usefulness." },
    ],
  },
  {
    name: "Automotive",
    slug: "automotive",
    icon: "▰",
    h1: "Automotive Product Deals and Compatibility Checks",
    description: "Research vehicle-related products with careful attention to compatibility, installation, safety instructions, and support.",
    editorialContent:
      "Vehicle compatibility and correct installation come first. Confirm the year, make, model, dimensions, applicable standards, and installation requirements using the manufacturer's current guidance before considering price.",
    buyingTips: [
      "Confirm year, make, model, and product compatibility.",
      "Follow current installation and safety instructions.",
      "Check warranty, replacement parts, and support options.",
    ],
    faqItems: [
      { question: "How do I confirm automotive product compatibility?", answer: "Use the manufacturer's current fit guide and verify your vehicle's year, make, model, trim, and relevant dimensions." },
      { question: "Can an editorial page replace installation instructions?", answer: "No. Follow the manufacturer's instructions and use qualified help when the product requires it." },
      { question: "What should I compare besides price?", answer: "Compare fit, applicable safety guidance, materials, warranty, replacement parts, and installation requirements." },
    ],
  },
];

const stores = new Map<string, string>();
for (const value of storeSeed) {
  const row = await prisma.store.upsert({
    where: { slug: value.slug },
    update: { ...value, faqItems: value.faqItems, active: true, robotsIndex: true, robotsFollow: true, schemaEnabled: true },
    create: { ...value, faqItems: value.faqItems, active: true, robotsIndex: true, robotsFollow: true, schemaEnabled: true },
  });
  stores.set(value.slug, row.id);
}

const categories = new Map<string, string>();
for (const value of categorySeed) {
  const { faqItems, ...fields } = value;
  const row = await prisma.category.upsert({
    where: { slug: value.slug },
    update: {
      ...fields,
      faqItems: json(faqItems),
      status: "ACTIVE",
      sortOrder: categories.size,
      seoTitle: `${value.h1} | Bargain MOM`,
      seoDescription: value.description,
      robotsIndex: true,
      robotsFollow: true,
      schemaEnabled: true,
    },
    create: {
      ...fields,
      faqItems: json(faqItems),
      status: "ACTIVE",
      sortOrder: categories.size,
      seoTitle: `${value.h1} | Bargain MOM`,
      seoDescription: value.description,
      robotsIndex: true,
      robotsFollow: true,
      schemaEnabled: true,
    },
  });
  categories.set(value.slug, row.id);
}

const brandNames = [
  "Sony", "Ninja", "Fitbit", "Dyson", "iRobot", "Le Creuset", "Apple", "Instant Pot", "Samsung", "LEGO",
  "Nespresso", "KitchenAid", "CeraVe", "Adidas", "Graco", "Philips", "Bose", "Shark", "Canon", "Coleman",
];
const brands = new Map<string, string>();
for (const name of brandNames) {
  const slug = slugify(name);
  const description = `Catalog records for ${name} products used to demonstrate the editorial and comparison workflow. Verify product and trademark details before publication.`;
  const row = await prisma.brand.upsert({
    where: { slug },
    update: {
      name,
      description,
      logo: logo(name),
      active: true,
      seoTitle: `${name} Product Research | Bargain MOM`,
      seoDescription: description,
      robotsIndex: false,
      robotsFollow: true,
      schemaEnabled: false,
    },
    create: {
      name,
      slug,
      description,
      logo: logo(name),
      active: true,
      seoTitle: `${name} Product Research | Bargain MOM`,
      seoDescription: description,
      robotsIndex: false,
      robotsFollow: true,
      schemaEnabled: false,
    },
  });
  brands.set(slug, row.id);
}

const productSeed = [
  { title: "Sony WH-CH720N Wireless Headphones", slug: "sony-wh-ch720n-wireless-headphones", brand: "Sony", category: "electronics", store: "amazon", currentPrice: 89.99, oldPrice: 149.99, discountPercent: 35, rating: 4.7, reviewCount: 4235, image: "photo-1505740420928-5e560c06d30e", summary: "A lightweight over-ear wireless headphone format aimed at listeners who prioritize portability and everyday noise reduction.", idealFor: "Commuters and travelers comparing an over-ear wireless design with active noise-control features.", notIdealFor: "Shoppers who specifically need studio monitoring, a wired-only design, or sport-focused water resistance.", comparison: "Compare comfort, microphone behavior, battery needs, codec support, and folding or carrying options with similarly priced travel headphones." },
  { title: "Ninja AF101 Air Fryer", slug: "ninja-af101-air-fryer", brand: "Ninja", category: "kitchen", store: "walmart", currentPrice: 79.99, oldPrice: 109.99, discountPercent: 28, rating: 4.8, reviewCount: 12540, image: "photo-1616348436168-de43ad0db179", summary: "A countertop air-fryer format for small batches, reheating, and crisping without using a full-size oven.", idealFor: "Smaller households that want a dedicated appliance for quick portions and reheating.", notIdealFor: "Large households that need to cook several servings in one uninterrupted batch.", comparison: "Compare usable basket area, counter footprint, temperature range, cleaning access, and noise with other compact air fryers." },
  { title: "Fitbit Versa 4 Smartwatch", slug: "fitbit-versa-4-smartwatch", brand: "Fitbit", category: "electronics", store: "target", currentPrice: 119.95, oldPrice: 149.95, discountPercent: 20, rating: 4.6, reviewCount: 8752, image: "photo-1523275335684-37898b6baf30", summary: "A wrist-based activity tracker and smartwatch format for everyday movement, workouts, and phone-linked notifications.", idealFor: "People who want general activity trends and a lightweight smartwatch experience.", notIdealFor: "Anyone who needs a medical device or a specialized training computer for advanced performance metrics.", comparison: "Compare supported phone platforms, sensor set, subscription-dependent features, charging routine, and app experience." },
  { title: "Dyson V8 Cordless Vacuum", slug: "dyson-v8-cordless-vacuum", brand: "Dyson", category: "home", store: "best-buy", currentPrice: 279.99, oldPrice: 399.99, discountPercent: 30, rating: 4.7, reviewCount: 6124, image: "photo-1558317374-067fb5f30001", summary: "A cordless stick-vacuum format designed for quick floor and above-floor cleaning without a power cord.", idealFor: "Homes that value grab-and-go cleaning and can work within a battery-powered routine.", notIdealFor: "Long uninterrupted cleaning sessions where corded runtime or a larger dust capacity is more important.", comparison: "Compare runtime by power mode, floor-head suitability, bin capacity, filter care, included tools, and replacement battery options." },
  { title: "iRobot Roomba Robot Vacuum", slug: "irobot-roomba-robot-vacuum", brand: "iRobot", category: "home", store: "amazon", currentPrice: 189.99, oldPrice: 249.99, discountPercent: 25, rating: 4.5, reviewCount: 7143, image: "https://placehold.co/700x560/f4f5f7/0b1428?text=iRobot+Roomba", summary: "A robot-vacuum format intended for scheduled maintenance cleaning on compatible floor plans.", idealFor: "Households that want frequent automated pickup between deeper manual cleaning sessions.", notIdealFor: "Cluttered layouts, tall thresholds, or shoppers expecting one device to replace every form of floor cleaning.", comparison: "Compare navigation method, obstacle handling, brush maintenance, app requirements, dock design, and replacement-part cost." },
  { title: "Le Creuset Enameled Dutch Oven", slug: "le-creuset-enameled-dutch-oven", brand: "Le Creuset", category: "kitchen", store: "walmart", currentPrice: 349, oldPrice: 449, discountPercent: 22, rating: 4.9, reviewCount: 2350, image: "https://placehold.co/700x560/fff2e9/ff5a00?text=Le+Creuset", summary: "An enameled cast-iron Dutch-oven format suited to braising, simmering, baking, and oven-to-table serving.", idealFor: "Cooks who value heat retention and expect to use one heavy pot across several techniques.", notIdealFor: "Anyone who needs lightweight cookware or prefers pieces that require minimal lifting and handling.", comparison: "Compare capacity, weight, lid fit, handle clearance, care instructions, warranty terms, and alternatives in enameled cast iron." },
  { title: "Apple AirPods Pro 2nd Gen", slug: "apple-airpods-pro-2nd-gen", brand: "Apple", category: "electronics", store: "amazon", currentPrice: 189.99, oldPrice: 249, discountPercent: 24, rating: 4.8, reviewCount: 21543, image: "photo-1600294037681-c80b4cb5b434", summary: "A compact true-wireless earbud format designed around portable listening, calls, and integration with compatible devices.", idealFor: "Listeners who value a pocketable charging case and close integration with supported Apple devices.", notIdealFor: "People who dislike in-ear tips or require guaranteed fit without trying multiple tip sizes.", comparison: "Compare device compatibility, fit, control scheme, noise control, microphone performance, case charging, and replacement cost." },
  { title: "Instant Pot Duo 7-in-1 Pressure Cooker", slug: "instant-pot-duo-pressure-cooker", brand: "Instant Pot", category: "kitchen", store: "target", currentPrice: 59.99, oldPrice: 99.99, discountPercent: 40, rating: 4.8, reviewCount: 17892, image: "photo-1585515320310-259814833e62", summary: "A multicooker format that combines pressure cooking with several slower or lower-temperature countertop cooking modes.", idealFor: "Cooks who want one appliance for pressure-cooked meals, grains, and flexible batch preparation.", notIdealFor: "Shoppers mainly seeking crisp or browned results without a separate air-frying or oven step.", comparison: "Compare usable capacity, control layout, release method, included pot, cleaning steps, counter height, and available replacement seals." },
  { title: "Samsung 55-inch Crystal UHD 4K TV", slug: "samsung-55-inch-crystal-uhd-tv", brand: "Samsung", category: "electronics", store: "best-buy", currentPrice: 329.99, oldPrice: 429.99, discountPercent: 23, rating: 4.6, reviewCount: 9312, image: "photo-1593359677879-a4bb92f829d1", summary: "A 55-inch 4K television format for general streaming, broadcast viewing, and connected living-room use.", idealFor: "Rooms suited to a mid-size screen where smart-platform convenience matters more than specialist home-theater features.", notIdealFor: "Buyers prioritizing advanced gaming specifications or premium contrast without confirming the exact model capabilities.", comparison: "Verify the exact model year, panel features, ports, refresh-rate support, stand width, mounting pattern, and smart-platform apps." },
  { title: "LEGO Classic Large Creative Brick Box", slug: "lego-classic-large-creative-brick-box", brand: "LEGO", category: "kids-toys", store: "walmart", currentPrice: 34.99, oldPrice: 49.99, discountPercent: 30, rating: 4.9, reviewCount: 6301, image: "photo-1594787318286-3d835c1d207f", summary: "An open-ended construction-brick set intended for free building rather than one finished display model.", idealFor: "Builders who enjoy reusable pieces and inventing multiple small projects.", notIdealFor: "Children below the manufacturer's stated age range or households that cannot safely manage small pieces.", comparison: "Compare piece variety, specialized elements, storage needs, age guidance, and compatibility with an existing brick collection." },
  { title: "Nespresso Vertuo Next Coffee Machine", slug: "nespresso-vertuo-next-coffee-machine", brand: "Nespresso", category: "kitchen", store: "target", currentPrice: 119.99, oldPrice: 159.99, discountPercent: 25, rating: 4.5, reviewCount: 4218, image: "photo-1495474472287-4d71bcdd2085", summary: "A capsule coffee-machine format focused on convenient, repeatable preparation with compatible single-use capsules.", idealFor: "Coffee drinkers who prioritize speed and a compact routine over manual brewing control.", notIdealFor: "Shoppers who want to use standard ground coffee or minimize ongoing capsule cost and waste.", comparison: "Compare compatible capsule system, drink sizes, warm-up routine, water-tank placement, cleaning, and cost per serving." },
  { title: "KitchenAid Artisan Stand Mixer", slug: "kitchenaid-artisan-stand-mixer", brand: "KitchenAid", category: "kitchen", store: "amazon", currentPrice: 349.99, oldPrice: 449.99, discountPercent: 22, rating: 4.9, reviewCount: 3874, image: "https://placehold.co/700x560/f8eee9/a8261a?text=KitchenAid+Mixer", summary: "A tilt-head stand-mixer format for recurring mixing, whipping, and kneading tasks with compatible attachments.", idealFor: "Regular bakers who have permanent counter or storage space for a substantial appliance.", notIdealFor: "Occasional light mixing where a smaller hand mixer would meet the need with less cost and storage.", comparison: "Compare bowl capacity, head clearance, mixer weight, included tools, attachment ecosystem, cleaning, and warranty." },
  { title: "CeraVe Daily Skincare Set", slug: "cerave-daily-skincare-set", brand: "CeraVe", category: "beauty", store: "target", currentPrice: 29.99, oldPrice: 39.99, discountPercent: 25, rating: 4.7, reviewCount: 5643, image: "photo-1556228578-8c89e6adf883", summary: "A bundled skincare format intended to group complementary daily-use products into one purchase.", idealFor: "Shoppers who have reviewed the included formulas and expect to use every item in the set.", notIdealFor: "Anyone with ingredient sensitivities or a routine that only needs one of the included products.", comparison: "Compare the exact included sizes and formulas, ingredient lists, individual-item pricing, use frequency, and expiration guidance." },
  { title: "Adidas Cloudfoam Running Shoes", slug: "adidas-cloudfoam-running-shoes", brand: "Adidas", category: "fashion", store: "ebay", currentPrice: 54.99, oldPrice: 79.99, discountPercent: 31, rating: 4.6, reviewCount: 2891, image: "photo-1542291026-7eec264c27ff", summary: "A cushioned athletic-shoe format that may suit casual running, walking, or everyday wear depending on the exact model.", idealFor: "Shoppers seeking a lightweight everyday athletic shoe after confirming fit and intended use.", notIdealFor: "Runners who need a specialist shoe selected for a specific gait, terrain, or training load.", comparison: "Confirm the exact model, size and width, seller condition, outsole, intended activity, return process, and total delivered cost." },
  { title: "Graco Convertible Car Seat", slug: "graco-convertible-car-seat", brand: "Graco", category: "automotive", store: "walmart", currentPrice: 139.99, oldPrice: 179.99, discountPercent: 22, rating: 4.8, reviewCount: 4460, image: "photo-1591348278863-a8fb3887e2aa", summary: "A convertible child-restraint format intended to cover more than one seating configuration when used within its stated limits.", idealFor: "Caregivers who have confirmed fit for the child, vehicle, seating position, and installation method.", notIdealFor: "Any situation outside the manufacturer's current height, weight, age, installation, or expiration guidance.", comparison: "Safety comes first: verify the exact model, current instructions, limits, vehicle fit, installation, recalls, condition, and expiration date." },
  { title: "Philips Sonicare Electric Toothbrush", slug: "philips-sonicare-electric-toothbrush", brand: "Philips", category: "beauty", store: "best-buy", currentPrice: 49.99, oldPrice: 79.99, discountPercent: 38, rating: 4.7, reviewCount: 7210, image: "photo-1606811971618-4486d14f3f99", summary: "A rechargeable electric-toothbrush format with replaceable brush heads and model-dependent cleaning modes.", idealFor: "People who prefer a powered brushing routine and are comfortable with recurring replacement-head costs.", notIdealFor: "Anyone whose dental professional recommends a different approach or who cannot source compatible replacement heads.", comparison: "Compare included handle and heads, compatible replacements, timer or pressure features, charging setup, travel case, and warranty." },
  { title: "Bose SoundLink Bluetooth Speaker", slug: "bose-soundlink-bluetooth-speaker", brand: "Bose", category: "electronics", store: "ebay", currentPrice: 99.99, oldPrice: 129.99, discountPercent: 23, rating: 4.7, reviewCount: 5844, image: "photo-1608043152269-423dbba4e7e1", summary: "A portable Bluetooth-speaker format for phone-linked listening in spaces where size and easy transport matter.", idealFor: "Listeners seeking a compact speaker for casual room-to-room or travel use.", notIdealFor: "Buyers who need a full stereo system, specialized inputs, or performance for large event spaces.", comparison: "Compare size, weight, charging port, water-resistance rating, battery routine, supported inputs, seller condition, and warranty." },
  { title: "Shark Steam Mop", slug: "shark-steam-mop", brand: "Shark", category: "home", store: "walmart", currentPrice: 69.99, oldPrice: 99.99, discountPercent: 30, rating: 4.5, reviewCount: 3280, image: "photo-1527515637462-cff94eecc1ac", summary: "A corded steam-mop format for compatible sealed hard floors using washable or replaceable cleaning pads.", idealFor: "Homes with manufacturer-approved sealed flooring and a routine that benefits from steam cleaning.", notIdealFor: "Unsealed, heat-sensitive, or otherwise incompatible surfaces.", comparison: "Confirm floor compatibility first, then compare cord length, heat-up routine, tank handling, pad availability, storage, and cleaning instructions." },
  { title: "Canon EOS Compact Camera", slug: "canon-eos-compact-camera", brand: "Canon", category: "electronics", store: "best-buy", currentPrice: 449.99, oldPrice: 549.99, discountPercent: 18, rating: 4.6, reviewCount: 1890, image: "photo-1516035069371-29a1b244cc32", summary: "A compact-camera catalog record for shoppers comparing dedicated photography controls with a phone-camera workflow.", idealFor: "People who want a dedicated camera after confirming the exact model, sensor, lens system, and video needs.", notIdealFor: "Anyone who has not verified the full model name because Canon EOS products vary widely in design and capability.", comparison: "This demo title is intentionally broad; confirm the exact model before comparing sensor, lens, stabilization, autofocus, video, battery, and accessories." },
  { title: "Coleman Family Camping Tent", slug: "coleman-family-camping-tent", brand: "Coleman", category: "sports", store: "amazon", currentPrice: 129.99, oldPrice: 179.99, discountPercent: 28, rating: 4.7, reviewCount: 2765, image: "photo-1504280390367-361c6d9f38f4", summary: "A family-tent format for car camping where sleeping layout, weather protection, setup, and packed size all affect usability.", idealFor: "Car campers who can verify stated capacity, site footprint, seasonal use, and packed dimensions.", notIdealFor: "Backpacking or severe-weather use without specifications that explicitly support those conditions.", comparison: "Compare realistic sleeping layout, floor dimensions, peak height, weather guidance, setup, packed weight, ventilation, and included stakes or footprint." },
];

const products = [];
for (let index = 0; index < productSeed.length; index += 1) {
  const item = productSeed[index];
  const brandSlug = slugify(item.brand);
  const categoryName = categorySeed.find((category) => category.slug === item.category)?.name ?? item.category;
  const retailerName = retailerLabel(item.store);
  const destination = retailerSearchUrl(item.store, item.title);
  const common = {
    title: item.title,
    description: `${item.summary} This is seeded demonstration content based on general product type and publicly described positioning; it is not a first-hand test or a verified live offer.`,
    shortDescription: `Demo catalog record for ${item.title}; verify every price and retailer detail before publication.`,
    currentPrice: item.currentPrice,
    oldPrice: item.oldPrice,
    discountPercent: item.discountPercent,
    rating: item.rating,
    reviewCount: item.reviewCount,
    affiliateUrl: destination,
    ctaLabel: `Search ${retailerName} for this model`,
    badge: null,
    availability: null,
    keyFeatures: [
      `Product type: ${categoryName}`,
      `Brand label: ${item.brand}`,
      "Exact specifications must be confirmed against the current manufacturer and retailer listing",
    ],
    pros: ["The format may suit the use case described in this editorial record", "Key buying questions are organized in one place"],
    cons: ["The seeded price and rating are not verified live data", "Specifications and included accessories can vary by exact model or listing"],
    whyRecommend: null,
    bestFor: item.idealFor,
    buyingAdvice: "Confirm the exact model, current price, availability, shipping, warranty, and return terms on the retailer page before purchasing.",
    editorialSummary: item.summary,
    idealFor: item.idealFor,
    notIdealFor: item.notIdealFor,
    importantSpecs: json({
      "Product type": categoryName,
      "Brand shown": item.brand,
      "Verification status": "Demo record — specifications and offer details require review",
    }),
    comparisonNotes: item.comparison,
    dealAnalysis: "The displayed amount and discount are seeded demo values, not a verified current offer. Do not publish deal claims until a real check has been recorded.",
    alternativesNotes: `Compare this record with other ${categoryName.toLowerCase()} options that match the same use case, space, compatibility, and ownership-cost requirements.`,
    whatWeLike: "The product format addresses a recognizable shopping use case and supports a concrete comparison checklist.",
    whatCouldBeBetter: "A production-ready page needs exact model-level specifications, a current retailer check, and independently reviewed source details.",
    bestUseCases: [item.idealFor],
    faqItems: json([
      { question: `Who may find the ${item.title} suitable?`, answer: item.idealFor },
      { question: `Who should compare alternatives to the ${item.title}?`, answer: item.notIdealFor },
      { question: "Is the displayed price verified?", answer: "No. This seeded product is for demonstration and is intentionally excluded from search indexing and Product schema until an editor verifies the live offer." },
    ]),
    lastVerifiedAt: null,
    priceUpdatedAt: null,
    contentUpdatedAt: CONTENT_DATE,
    tags: ["demo-seed", item.category],
    status: "ACTIVE" as const,
    featured: index < 8,
    categoryId: categories.get(item.category),
    brandId: brands.get(brandSlug),
    storeId: stores.get(item.store),
    seoTitle: `${item.title} Buying Notes (Demo) | Bargain MOM`,
    seoDescription: `${item.summary} Demo record; live price and specifications require editorial verification.`,
    robotsIndex: false,
    robotsFollow: true,
    schemaEnabled: false,
  };
  const row = await prisma.product.upsert({
    where: { slug: item.slug },
    update: common,
    create: { ...common, slug: item.slug },
  });
  await prisma.productImage.deleteMany({ where: { productId: row.id } });
  await prisma.productImage.create({
    data: { productId: row.id, url: image(item.image), altText: item.title, sortOrder: 0 },
  });
  await prisma.affiliateLink.upsert({
    where: { id: `demo-retailer-search-${item.slug}` },
    update: {
      label: `Search ${retailerName} for this model`,
      url: destination,
      active: true,
      productId: row.id,
    },
    create: {
      id: `demo-retailer-search-${item.slug}`,
      label: `Search ${retailerName} for this model`,
      url: destination,
      active: true,
      productId: row.id,
    },
  });
  products.push(row);
}

for (let index = 0; index < 8; index += 1) {
  const product = products[index];
  await prisma.deal.upsert({
    where: { slug: `demo-${product.slug}` },
    update: {
      productId: product.id,
      discountPercent: product.discountPercent,
      startsAt: DEMO_DEAL_START,
      endsAt: DEMO_DEAL_END,
      status: "ACTIVE",
      featured: false,
      badge: "Demo offer — unverified",
      robotsIndex: false,
      robotsFollow: true,
      schemaEnabled: false,
    },
    create: {
      slug: `demo-${product.slug}`,
      productId: product.id,
      discountPercent: product.discountPercent,
      startsAt: DEMO_DEAL_START,
      endsAt: DEMO_DEAL_END,
      status: "ACTIVE",
      featured: false,
      badge: "Demo offer — unverified",
      robotsIndex: false,
      robotsFollow: true,
      schemaEnabled: false,
    },
  });
}

const bannerData = [
  {
    id: "demo-banner-amazon",
    title: "Explore Amazon-linked products",
    subtitle: "Compare the exact listing, seller, fulfillment, and return terms before purchasing.",
    image: image("photo-1523474253046-8cd2748b5fd2"),
    logo: storeSeed[0].logo,
    background: "#071225",
    buttonLabel: "Browse Amazon products",
    buttonUrl: "/store/amazon",
    status: "ACTIVE" as const,
    sortOrder: 4,
    storeId: stores.get("amazon"),
  },
  {
    id: "demo-banner-walmart",
    title: "Explore Walmart-linked products",
    subtitle: "Review variations, fulfillment options, and retailer terms for the product you choose.",
    image: image("photo-1601599561213-832382fd07ba"),
    logo: storeSeed[1].logo,
    background: "#eef5ff",
    buttonLabel: "Browse Walmart products",
    buttonUrl: "/store/walmart",
    status: "ACTIVE" as const,
    sortOrder: 5,
    storeId: stores.get("walmart"),
  },
];
for (const banner of bannerData) {
  await prisma.banner.upsert({ where: { id: banner.id }, update: banner, create: banner });
}

const sections: {
  id: string;
  type: SectionType;
  title?: string;
  subtitle?: string;
  sortOrder: number;
  maxItems?: number;
  config?: Prisma.InputJsonValue;
  ctaText?: string;
  ctaUrl?: string;
}[] = [
  {
    id: "demo-hero",
    type: "HERO",
    title: "Big Deals. Smart Shopping.",
    subtitle: "Research products, compare useful details, and confirm every offer with the retailer before buying.",
    sortOrder: 0,
    ctaText: "Search products",
    config: json({
      eyebrow: "Shopping research for U.S. shoppers",
      searchPlaceholder: "What are you looking for?",
      benefits: ["Clear product context", "Useful comparisons", "Retailer links", "Visible disclosure"],
    }),
  },
  { id: "demo-stores", type: "STORE_LOGOS", title: "Browse by store", sortOrder: 1 },
  { id: "demo-featured", type: "FEATURED_PRODUCTS", title: "Featured Product Research", sortOrder: 2, maxItems: 8, ctaText: "View all products", ctaUrl: "/deals" },
  { id: "demo-categories", type: "CATEGORY_GRID", title: "Shop by Category", sortOrder: 3, maxItems: 8, ctaText: "View all categories", ctaUrl: "/categories" },
  { id: "demo-top-store", type: "STORE_PRODUCTS", title: "Products by Store", sortOrder: 6, maxItems: 12, ctaText: "View all stores", ctaUrl: "/stores" },
  {
    id: "demo-trust",
    type: "TRUST_FEATURES",
    title: "How Bargain MOM helps",
    sortOrder: 7,
    config: json({
      items: [
        { icon: "◇", title: "Price context", description: "See the information needed to evaluate an offer." },
        { icon: "◆", title: "Retailer details", description: "Confirm seller and fulfillment terms before checkout." },
        { icon: "↗", title: "Clear redirects", description: "Purchases happen on the external retailer's site." },
        { icon: "♥", title: "Editorial guidance", description: "Use-case notes help narrow a practical shortlist." },
      ],
    }),
  },
  { id: "demo-blog", type: "BLOG", title: "Latest Shopping Guides", sortOrder: 8, maxItems: 4, ctaText: "View all articles", ctaUrl: "/blog" },
];
for (const section of sections) {
  await prisma.homepageSection.upsert({
    where: { id: section.id },
    update: { ...section, visible: true },
    create: { ...section, visible: true },
  });
}

for (const sectionId of ["demo-stores", "demo-top-store"]) {
  await prisma.homepageSectionStore.deleteMany({ where: { sectionId } });
  await prisma.homepageSectionStore.createMany({
    data: Array.from(stores.values()).map((storeId, sortOrder) => ({ sectionId, storeId, sortOrder })),
  });
}
await prisma.homepageSectionCategory.deleteMany({ where: { sectionId: "demo-categories" } });
await prisma.homepageSectionCategory.createMany({
  data: Array.from(categories.values()).map((categoryId, sortOrder) => ({ sectionId: "demo-categories", categoryId, sortOrder })),
});
for (const sectionId of ["demo-featured", "demo-top-store"]) {
  await prisma.homepageSectionProduct.deleteMany({ where: { sectionId } });
  const sectionProducts = sectionId === "demo-featured" ? products.slice(0, 8) : products;
  await prisma.homepageSectionProduct.createMany({
    data: sectionProducts.map((product, sortOrder) => ({ sectionId, productId: product.id, sortOrder })),
  });
}

for (const category of categorySeed) {
  const categoryId = categories.get(category.slug)!;
  const selected = products.filter((product) => product.categoryId === categoryId).slice(0, 3);
  await prisma.categoryFeaturedProduct.deleteMany({ where: { categoryId } });
  if (selected.length) {
    await prisma.categoryFeaturedProduct.createMany({
      data: selected.map((product, sortOrder) => ({ categoryId, productId: product.id, sortOrder })),
    });
  }
}

const author = await prisma.author.upsert({
  where: { slug: "bargain-mom-editorial-team" },
  update: {
    name: "Bargain MOM Editorial Team",
    bio: "The Bargain MOM editorial team organizes publicly available product specifications, retailer information, and shopping considerations. Seeded demo records are labeled and are not presented as first-hand testing.",
    expertise: ["Shopping research", "Product comparison", "Deal context"],
    profileUrls: [],
    active: true,
  },
  create: {
    name: "Bargain MOM Editorial Team",
    slug: "bargain-mom-editorial-team",
    bio: "The Bargain MOM editorial team organizes publicly available product specifications, retailer information, and shopping considerations. Seeded demo records are labeled and are not presented as first-hand testing.",
    expertise: ["Shopping research", "Product comparison", "Deal context"],
    profileUrls: [],
    active: true,
  },
});

const blogCategory = await prisma.blogCategory.upsert({
  where: { slug: "shopping-guides" },
  update: { name: "Shopping Guides" },
  create: { name: "Shopping Guides", slug: "shopping-guides" },
});
const articles = [
  {
    title: "10 Questions to Ask Before Following an Online Deal",
    slug: "questions-to-ask-before-following-an-online-deal",
    excerpt: "A practical checklist for comparing the exact product, total cost, seller, shipping, and return terms.",
    image: "photo-1556742049-0cfed4f6a45d",
    readingTime: 6,
    content: "Start by matching the exact model or variation, not just the product family name. Then compare the delivered total, seller identity, fulfillment method, return window, warranty, and included accessories.\n\nA crossed-out price is not enough evidence of value by itself. Compare the current amount with similar products that solve the same problem, and decide which features you will actually use.\n\nBefore checkout, open the retailer page and confirm that the selected size, color, condition, seller, and shipping destination still match the offer you intended to view.",
  },
  {
    title: "Amazon vs. Walmart: A Practical Shopping Comparison",
    slug: "amazon-vs-walmart-practical-shopping-comparison",
    excerpt: "Compare seller models, fulfillment choices, local pickup, returns, and the details that can change the real value of an offer.",
    image: "photo-1607082349566-187342175e2f",
    readingTime: 7,
    content: "Amazon and Walmart both cover broad product catalogs, but an individual offer can differ in seller, fulfillment, local availability, and return handling. The better choice depends on the exact item and the service details that matter for that purchase.\n\nOn either site, verify who is selling the item and who will fulfill it. Walmart may add useful local pickup options, while Amazon listings may offer several sellers or variations under similar product pages.\n\nCompare the delivered total, expected arrival or pickup timing, return path, and exact model before deciding. Bargain MOM does not process the transaction or control retailer terms.",
  },
  {
    title: "How to Choose a Countertop Kitchen Appliance",
    slug: "how-to-choose-a-countertop-kitchen-appliance",
    excerpt: "Use capacity, counter space, cleaning effort, and realistic weekly use to choose between popular appliance formats.",
    image: "photo-1556911220-bff31c812dba",
    readingTime: 7,
    content: "Begin with the meals and portions you make most often. An appliance that cannot handle a common batch size may create extra work, while an oversized appliance can take more room than it earns.\n\nMeasure counter height, cabinet clearance, and storage before ordering. Review which removable parts need hand washing, which consumables or replacement parts are required, and whether the appliance duplicates equipment you already own.\n\nFinally, compare useful capacity and workflow rather than counting preset buttons. A simpler model can be the better fit when it handles the core task reliably and is easy to clean.",
  },
  {
    title: "A Seasonal Purchase Planning Checklist",
    slug: "seasonal-purchase-planning-checklist",
    excerpt: "Plan purchases around a real need, a target budget, and enough time to compare model and return details.",
    image: "photo-1507525428034-b723cf961d3e",
    readingTime: 5,
    content: "Write down the required features and maximum delivered price before a large promotion begins. This makes it easier to ignore irrelevant discounts and compare products that meet the same need.\n\nSave exact model numbers, not only product names. When an offer appears, compare the variation, seller, included accessories, shipping timing, and return window.\n\nA seasonal label does not guarantee the lowest available price. Buy when the product meets your requirements and budget, and confirm the retailer's current terms before checkout.",
  },
];
const blogPosts = new Map<string, string>();
for (let index = 0; index < articles.length; index += 1) {
  const article = articles[index];
  const data = {
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    coverImage: image(article.image),
    author: author.name,
    authorId: author.id,
    tags: ["demo-seed", "shopping research"],
    status: "ACTIVE" as const,
    publishedAt: new Date(CONTENT_DATE.getTime() - index * 3 * 86_400_000),
    contentUpdatedAt: CONTENT_DATE,
    readingTime: article.readingTime,
    seoTitle: `${article.title} | Bargain MOM`,
    seoDescription: article.excerpt,
    robotsIndex: false,
    robotsFollow: true,
    schemaEnabled: false,
    categoryId: blogCategory.id,
  };
  const row = await prisma.blogPost.upsert({
    where: { slug: article.slug },
    update: data,
    create: { ...data, slug: article.slug },
  });
  blogPosts.set(article.slug, row.id);
}
await prisma.blogPost.updateMany({
  where: {
    tags: { has: "demo-seed" },
    slug: { notIn: articles.map((article) => article.slug) },
  },
  data: { status: "INACTIVE", robotsIndex: false, robotsFollow: true, schemaEnabled: false },
});

const productBySlug = new Map(products.map((product) => [product.slug, product]));
const guideSeed = [
  {
    title: "Best Air Fryers Under $100: What to Compare",
    slug: "best-air-fryers-under-100",
    category: "kitchen",
    intro: "An answer-first checklist for comparing sub-$100 air fryers by usable capacity, footprint, temperature controls, and cleaning effort.",
    body: "For most shoppers, the best sub-$100 air fryer is the one that fits a normal batch, fits the available counter space, and is easy enough to clean after regular use. Treat the price ceiling as a filter, then compare the actual cooking basket and workflow.\n\nPrices in this seeded guide are demonstration data and have not been verified as live offers.",
    sections: [
      { heading: "Start with usable capacity", body: "Marketing capacity does not always describe the flat cooking area. Consider the foods and portions you prepare most often." },
      { heading: "Measure the full footprint", body: "Leave room for ventilation, the open basket, and overhead cabinets as directed by the manufacturer." },
      { heading: "Account for cleanup", body: "Review basket shape, removable parts, coating care, and whether parts are listed as dishwasher-safe." },
    ],
    faq: [
      { question: "What matters most in a budget air fryer?", answer: "Useful basket area, safe counter fit, predictable controls, and manageable cleanup are strong starting points." },
      { question: "Is a higher wattage automatically better?", answer: "No. Consider cooking performance together with capacity, circuit requirements, controls, and the foods you make." },
      { question: "Are the prices in this demo guide current?", answer: "No. They are seed data and must be verified by an editor before the guide is made indexable." },
    ],
    products: ["ninja-af101-air-fryer", "instant-pot-duo-pressure-cooker"],
    hero: "photo-1556911220-bff31c812dba",
  },
  {
    title: "Best Headphones for Travel: A Buying Checklist",
    slug: "best-headphones-for-travel",
    category: "electronics",
    intro: "Choose travel headphones by comfort, packability, noise control, charging, microphone behavior, and device compatibility.",
    body: "For long trips, comfort and predictable battery management often matter more than a small difference in sound features. Decide between over-ear and in-ear designs first, then compare the details that affect your route and devices.\n\nThe selected products are demonstration records, not a tested ranking.",
    sections: [
      { heading: "Choose a wearing style", body: "Over-ear designs can provide a different comfort and isolation profile than compact in-ear earbuds. Fit remains personal." },
      { heading: "Plan for charging and backup", body: "Check charging connection, case behavior, wired fallback where available, and how long the trip lasts between outlets." },
      { heading: "Confirm device compatibility", body: "Review Bluetooth support, app requirements, microphone use, and compatibility with in-flight or work equipment." },
    ],
    faq: [
      { question: "Are over-ear headphones always better for travel?", answer: "No. They may offer a comfortable, isolating fit, while earbuds are easier to carry. The better format depends on fit and luggage space." },
      { question: "What should I check for flights?", answer: "Consider comfort, battery routine, case size, wired compatibility if needed, and the rules for your carrier and devices." },
      { question: "Were these headphones personally tested?", answer: "No. This seeded guide demonstrates a research structure and does not claim first-hand testing." },
    ],
    products: ["sony-wh-ch720n-wireless-headphones", "apple-airpods-pro-2nd-gen"],
    hero: "photo-1505740420928-5e560c06d30e",
  },
  {
    title: "Robot Vacuums for Homes with Pet Hair: What Matters",
    slug: "robot-vacuums-for-pet-hair",
    category: "home",
    intro: "Compare brush maintenance, obstacle handling, floor transitions, bin care, scheduling, and replacement-part cost.",
    body: "A robot vacuum can help with frequent surface pickup, but it may not replace manual cleaning for stairs, upholstery, corners, or embedded debris. For pet hair, maintenance effort and navigation around real household obstacles deserve as much attention as suction claims.\n\nThis seeded guide uses demo products and should not be treated as a tested ranking.",
    sections: [
      { heading: "Look at brush maintenance", body: "Review how hair is removed from rollers and side brushes and how frequently filters and brushes may need replacement." },
      { heading: "Map the actual floor plan", body: "Consider cords, pet bowls, toys, thresholds, rugs, stairs, and the clearance under furniture." },
      { heading: "Keep manual cleaning in the plan", body: "Most homes still need separate tools for upholstery, stairs, edges, and occasional deeper cleaning." },
    ],
    faq: [
      { question: "Can a robot vacuum replace all pet-hair cleaning?", answer: "Usually not. It may help with regular floor pickup, while upholstery, stairs, edges, and deep cleaning often need other tools." },
      { question: "Which maintenance items should I price?", answer: "Check filters, brushes, rollers, bags if used, and any replacement battery or dock supplies." },
      { question: "Are the selected products a tested ranking?", answer: "No. They are demo records included to show how products can be selected dynamically from PostgreSQL." },
    ],
    products: ["irobot-roomba-robot-vacuum", "dyson-v8-cordless-vacuum", "shark-steam-mop"],
    hero: "photo-1558317374-067fb5f30001",
  },
  {
    title: "Kitchen Deals This Week: A Verification Workflow",
    slug: "kitchen-deals-this-week",
    category: "kitchen",
    intro: "A repeatable way to review short-lived kitchen offers without confusing an advertised discount with long-term value.",
    body: "Weekly deal content should begin with a real timestamped price check. Editors should compare the exact model, condition, included accessories, shipping, and return terms before assigning a deal label.\n\nThis demonstration guide contains no verified weekly deal claim and remains noindex until an editor completes that work.",
    sections: [
      { heading: "Verify the exact model", body: "Record the model or variation and avoid transferring a price between similar-looking products." },
      { heading: "Capture total cost", body: "Include shipping and required accessories when comparing the offer with alternatives." },
      { heading: "Expire temporary claims", body: "When the verified period ends, remove the discount badge while retaining useful evergreen product context." },
    ],
    faq: [
      { question: "When should a weekly deal be published?", answer: "Only after an editor verifies the exact offer and records a meaningful price-check time." },
      { question: "What happens when the deal expires?", answer: "The temporary deal should leave active modules while a useful evergreen product page may remain available." },
      { question: "Is this demo page a live weekly deal list?", answer: "No. It demonstrates the CMS workflow and intentionally remains excluded from indexing." },
    ],
    products: ["ninja-af101-air-fryer", "instant-pot-duo-pressure-cooker", "nespresso-vertuo-next-coffee-machine", "kitchenaid-artisan-stand-mixer"],
    hero: "photo-1556911220-bff31c812dba",
  },
  {
    title: "Budget Smartwatches: How to Choose for Your Routine",
    slug: "budget-smartwatches-buying-guide",
    category: "electronics",
    intro: "Compare phone compatibility, core sensors, subscription requirements, charging, comfort, and the metrics you will actually use.",
    body: "A useful budget smartwatch should support the phone and habits you already have. Start with compatibility and the few metrics or notifications you need, then review charging and ongoing service requirements.\n\nHealth and activity features are not a substitute for professional medical advice or a regulated medical device.",
    sections: [
      { heading: "Confirm phone support", body: "Check the current operating-system requirements and whether all advertised features work with your phone." },
      { heading: "Separate included and subscription features", body: "Review which insights require an ongoing paid service before comparing the purchase price." },
      { heading: "Choose a realistic charging routine", body: "Consider when the watch will charge and whether that schedule conflicts with the periods you want to track." },
    ],
    faq: [
      { question: "What should I prioritize in a budget smartwatch?", answer: "Phone compatibility, comfortable fit, the few measurements you need, and a manageable charging routine." },
      { question: "Do smartwatch health features provide medical diagnosis?", answer: "Do not assume that they do. Review the manufacturer's intended use and seek appropriate professional care for medical questions." },
      { question: "Is the smartwatch price in this guide live?", answer: "No. The selected record contains demo pricing and is excluded from indexing until verified." },
    ],
    products: ["fitbit-versa-4-smartwatch"],
    hero: "photo-1523275335684-37898b6baf30",
  },
];

const guideRows = new Map<string, string>();
for (let index = 0; index < guideSeed.length; index += 1) {
  const guide = guideSeed[index];
  const data = {
    title: guide.title,
    intro: guide.intro,
    body: guide.body,
    editorialSections: json(guide.sections),
    heroImage: image(guide.hero),
    heroImageAlt: `${guide.title} editorial guide`,
    faqItems: json(guide.faq),
    status: "ACTIVE" as const,
    publishedAt: new Date(CONTENT_DATE.getTime() - index * 86_400_000),
    categoryId: categories.get(guide.category),
    authorId: author.id,
    seoTitle: `${guide.title} | Bargain MOM`,
    seoDescription: guide.intro,
    robotsIndex: false,
    robotsFollow: true,
    schemaEnabled: false,
  };
  const row = await prisma.buyingGuide.upsert({
    where: { slug: guide.slug },
    update: data,
    create: { ...data, slug: guide.slug },
  });
  guideRows.set(guide.slug, row.id);
  await prisma.buyingGuideProduct.deleteMany({ where: { guideId: row.id } });
  const selected = guide.products.map((slug) => productBySlug.get(slug)).filter(Boolean);
  if (selected.length) {
    await prisma.buyingGuideProduct.createMany({
      data: selected.map((product, sortOrder) => ({ guideId: row.id, productId: product!.id, sortOrder })),
    });
  }
}

const blogInternalLinks = [
  {
    post: "questions-to-ask-before-following-an-online-deal",
    products: ["sony-wh-ch720n-wireless-headphones", "ninja-af101-air-fryer"],
    guides: ["kitchen-deals-this-week"],
    categories: ["electronics", "kitchen"],
  },
  {
    post: "amazon-vs-walmart-practical-shopping-comparison",
    products: ["apple-airpods-pro-2nd-gen", "instant-pot-duo-pressure-cooker"],
    guides: ["best-headphones-for-travel", "best-air-fryers-under-100"],
    categories: ["electronics", "kitchen", "home"],
  },
  {
    post: "how-to-choose-a-countertop-kitchen-appliance",
    products: ["ninja-af101-air-fryer", "instant-pot-duo-pressure-cooker", "kitchenaid-artisan-stand-mixer"],
    guides: ["best-air-fryers-under-100", "kitchen-deals-this-week"],
    categories: ["kitchen"],
  },
  {
    post: "seasonal-purchase-planning-checklist",
    products: ["fitbit-versa-4-smartwatch", "coleman-family-camping-tent"],
    guides: ["budget-smartwatches-buying-guide"],
    categories: ["electronics", "sports"],
  },
];
for (const links of blogInternalLinks) {
  const postId = blogPosts.get(links.post);
  if (!postId) continue;
  await prisma.blogPostProduct.deleteMany({ where: { postId } });
  await prisma.blogPostGuide.deleteMany({ where: { postId } });
  await prisma.blogPostCategory.deleteMany({ where: { postId } });

  const selectedProducts = links.products.map((slug) => productBySlug.get(slug)).filter(Boolean);
  const selectedGuides = links.guides.map((slug) => guideRows.get(slug)).filter(Boolean);
  const selectedCategories = links.categories.map((slug) => categories.get(slug)).filter(Boolean);
  if (selectedProducts.length) {
    await prisma.blogPostProduct.createMany({
      data: selectedProducts.map((product, sortOrder) => ({ postId, productId: product!.id, sortOrder })),
    });
  }
  if (selectedGuides.length) {
    await prisma.blogPostGuide.createMany({
      data: selectedGuides.map((guideId, sortOrder) => ({ postId, guideId: guideId!, sortOrder })),
    });
  }
  if (selectedCategories.length) {
    await prisma.blogPostCategory.createMany({
      data: selectedCategories.map((categoryId, sortOrder) => ({ postId, categoryId: categoryId!, sortOrder })),
    });
  }
}

const comparisonSeed = [
  {
    title: "Amazon vs. Walmart for Online Shopping",
    slug: "amazon-vs-walmart",
    introduction: "Neither store is automatically better for every purchase. Compare the exact seller, fulfillment method, local options, total cost, and return path for the item you need.",
    table: [
      { criterion: "Seller model", amazon: "Retail listings may be sold by Amazon or marketplace sellers.", walmart: "Listings may be sold by Walmart or marketplace sellers." },
      { criterion: "Local fulfillment", amazon: "Options depend on the listing and delivery area.", walmart: "Shipping, pickup, and local delivery may differ by ZIP code." },
      { criterion: "Returns", amazon: "Terms can vary by item, seller, and condition.", walmart: "Terms can vary by item, seller, condition, and fulfillment." },
      { criterion: "Best comparison method", amazon: "Check the exact seller, model, delivered total, and return terms.", walmart: "Check the exact seller, model, pickup or delivery choice, and return terms." },
    ],
    strengths: [
      { entity: "Amazon", items: ["Broad catalog", "Multiple fulfillment patterns"] },
      { entity: "Walmart", items: ["Broad everyday catalog", "Location-dependent pickup and delivery options"] },
    ],
    weaknesses: [
      { entity: "Amazon", items: ["Marketplace listings require seller-level review", "Similar variations can be easy to confuse"] },
      { entity: "Walmart", items: ["Local availability can vary", "Marketplace listings require seller-level review"] },
    ],
    pricingNotes: "Compare the delivered total for the exact product and seller. A seeded price or percentage on Bargain MOM is not a current retailer quote.",
    bestFor: "Amazon may fit a listing-specific delivery need; Walmart may fit a local pickup or everyday shopping workflow. The exact offer should decide.",
    verdict: "Choose the retailer that has the correct model with acceptable seller, fulfillment, total cost, and return terms at the time you buy.",
    faq: [
      { question: "Is Amazon always cheaper than Walmart?", answer: "No. Price varies by product, seller, location, fulfillment, and time. Compare the exact offer." },
      { question: "Which store is better for pickup?", answer: "Options depend on the item and ZIP code. Check the retailer's current local availability." },
      { question: "Does Bargain MOM process either order?", answer: "No. Orders are completed with the external retailer under that retailer's terms." },
    ],
    stores: ["amazon", "walmart"],
    products: [],
  },
  {
    title: "Robot Vacuum vs. Cordless Stick Vacuum",
    slug: "robot-vacuum-vs-cordless-stick-vacuum",
    introduction: "A robot vacuum emphasizes scheduled floor maintenance, while a cordless stick vacuum emphasizes direct control and reach. They solve overlapping but different cleaning tasks.",
    table: [
      { criterion: "Primary role", robot: "Automated recurring floor pickup", cordlessStick: "Manual floor and above-floor cleaning" },
      { criterion: "User effort", robot: "Setup, floor preparation, bin and brush maintenance", cordlessStick: "Active handling plus charging and bin maintenance" },
      { criterion: "Reach", robot: "Compatible open floor areas", cordlessStick: "Floors, stairs, edges, and attachments depending on model" },
      { criterion: "Key limitation", robot: "Obstacles, thresholds, and areas it cannot navigate", cordlessStick: "Battery runtime, user effort, and dust capacity" },
    ],
    strengths: [
      { entity: "Robot vacuum", items: ["Scheduled maintenance cleaning", "Can run with limited active handling"] },
      { entity: "Cordless stick vacuum", items: ["Direct control", "Can cover more surface types with suitable tools"] },
    ],
    weaknesses: [
      { entity: "Robot vacuum", items: ["Requires floor preparation and navigation-compatible spaces", "Does not handle stairs by itself"] },
      { entity: "Cordless stick vacuum", items: ["Requires active cleaning", "Runtime and bin size can limit long sessions"] },
    ],
    pricingNotes: "Compare the purchase price together with filters, brushes, batteries, bags, and other replacement parts. Demo prices on the selected products are unverified.",
    bestFor: "Choose a robot for recurring compatible-floor maintenance; choose a cordless stick for flexible manual cleaning. Some homes benefit from both roles.",
    verdict: "The right format depends on the floor plan and cleaning routine, not which product has the larger advertised discount.",
    faq: [
      { question: "Can a robot vacuum replace a stick vacuum?", answer: "Not for every home. Stairs, upholstery, edges, and deeper cleaning may still require a manually controlled tool." },
      { question: "Which format needs less maintenance?", answer: "Both require maintenance. Compare bins, filters, brushes, rollers, charging, and replacement parts for the exact models." },
      { question: "Were the selected vacuums tested by Bargain MOM?", answer: "No. These are seeded demonstration records and the comparison does not claim first-hand testing." },
    ],
    stores: [],
    products: ["irobot-roomba-robot-vacuum", "dyson-v8-cordless-vacuum"],
  },
];

for (let index = 0; index < comparisonSeed.length; index += 1) {
  const comparison = comparisonSeed[index];
  const data = {
    title: comparison.title,
    introduction: comparison.introduction,
    comparisonTable: json(comparison.table.map(({ criterion, ...values }) => ({ label: criterion, values: Object.values(values) }))),
    strengths: json(Object.fromEntries(comparison.strengths.map(({ entity, items }) => [entity, items]))),
    weaknesses: json(Object.fromEntries(comparison.weaknesses.map(({ entity, items }) => [entity, items]))),
    pricingNotes: comparison.pricingNotes,
    bestFor: comparison.bestFor,
    verdict: comparison.verdict,
    faqItems: json(comparison.faq),
    status: "ACTIVE" as const,
    publishedAt: new Date(CONTENT_DATE.getTime() - index * 86_400_000),
    authorId: author.id,
    seoTitle: `${comparison.title} | Bargain MOM`,
    seoDescription: comparison.introduction,
    robotsIndex: false,
    robotsFollow: true,
    schemaEnabled: false,
  };
  const row = await prisma.comparison.upsert({
    where: { slug: comparison.slug },
    update: data,
    create: { ...data, slug: comparison.slug },
  });
  await prisma.comparisonProduct.deleteMany({ where: { comparisonId: row.id } });
  await prisma.comparisonStore.deleteMany({ where: { comparisonId: row.id } });
  const selectedProducts = comparison.products.map((slug) => productBySlug.get(slug)).filter(Boolean);
  if (selectedProducts.length) {
    await prisma.comparisonProduct.createMany({
      data: selectedProducts.map((product, sortOrder) => ({ comparisonId: row.id, productId: product!.id, sortOrder })),
    });
  }
  const selectedStores = comparison.stores.map((slug) => stores.get(slug)).filter(Boolean);
  if (selectedStores.length) {
    await prisma.comparisonStore.createMany({
      data: selectedStores.map((storeId, sortOrder) => ({ comparisonId: row.id, storeId: storeId!, sortOrder })),
    });
  }
}

const trustPages = [
  howtoPageSeed,
  {
    title: "About Bargain MOM",
    slug: "about",
    intro: "Bargain MOM is an affiliate editorial website that helps shoppers research products and retailer offers.",
    description: "Learn how Bargain MOM organizes product research, buying guidance, and clearly disclosed retailer links.",
    content: "Bargain MOM publishes product context, category guidance, comparisons, and deal research for shoppers in the United States. It is not a retailer and does not sell, ship, or accept payment for products.\n\nEditors may use manufacturer specifications, retailer listings, public documentation, and other available sources. A page does not imply first-hand testing unless the page clearly and truthfully describes that testing.\n\nSome outbound links may be affiliate links. If a reader makes a qualifying purchase, Bargain MOM may earn a commission at no additional cost to the reader.",
  },
  {
    title: "Contact",
    slug: "contact",
    intro: "Contact Bargain MOM about corrections, editorial questions, or business inquiries.",
    description: "Find guidance for contacting Bargain MOM about corrections, editorial questions, and affiliate disclosures.",
    content: "Use the contact form below, or the support email displayed on this site when the administrator has configured one. For a correction, include the page URL, the statement that may be inaccurate, and a reliable source when available.\n\nFor affiliate or business inquiries, identify the company and the purpose of the message. Contacting Bargain MOM does not guarantee editorial coverage or a favorable recommendation.\n\nDo not send passwords, payment-card details, health records, or other sensitive information.",
  },
  {
    title: "Editorial Policy",
    slug: "editorial-policy",
    intro: "How Bargain MOM researches, writes, updates, and corrects editorial shopping content.",
    description: "Read Bargain MOM's policy on research, first-hand testing claims, price updates, corrections, and editorial independence.",
    content: "Our goal is to help readers understand products, tradeoffs, and retailer offers. Editors may consult official specifications, retailer listings, manuals, public safety information, and other relevant sources. We do not reuse manufacturer copy as a substitute for independent editorial explanation.\n\nWe only say that a product was personally tested when genuine first-hand testing occurred and the page can accurately explain it. Otherwise, we use language such as ‘based on published specifications’ and identify the limits of the research.\n\nPrices and availability can change. A verification date is shown only when a real check was recorded. Temporary deal claims should expire when their verified period ends, while useful evergreen product context may remain.\n\nCorrections should update the visible content and relevant structured data. Affiliate compensation does not guarantee coverage or a favorable verdict.",
  },
  {
    title: "How We Choose Deals",
    slug: "how-we-choose-deals",
    intro: "The factors Bargain MOM can use to evaluate whether an offer is useful to readers.",
    description: "See how product relevance, exact models, total cost, retailer terms, and price verification inform Bargain MOM deal coverage.",
    content: "A useful deal begins with a product that serves a clear need. Editors can compare the exact model, meaningful specifications, current price context, seller, fulfillment, shipping, return terms, and warranty before highlighting an offer.\n\nA large advertised percentage is not enough by itself. The reference price, available alternatives, total delivered cost, and product quality all affect value.\n\nDeal modules should use a genuine start and expiration period. When an offer expires or cannot be verified, the discount label should stop appearing. Bargain MOM cannot guarantee that an external retailer will keep a price or item available.",
  },
  {
    title: "Affiliate Disclosure",
    slug: "affiliate-disclosure",
    intro: "Some links on Bargain MOM may earn the site a commission.",
    description: "Understand how affiliate links work on Bargain MOM and what they mean for product prices and editorial coverage.",
    content: `${affiliateDisclosure}\n\nBargain MOM is not the merchant of record. When you follow an outbound link, the retailer handles the product listing, payment, shipping, returns, customer service, and any warranty under its own terms.\n\nAffiliate relationships do not guarantee that a product will be included or recommended. Readers should compare the exact item and retailer terms before purchasing.`,
  },
  {
    title: "Privacy Policy",
    slug: "privacy",
    intro: "This policy explains the types of information the site may process and why.",
    description: "Read the Bargain MOM privacy overview for analytics, affiliate clicks, newsletter signups, and external links.",
    content: "Bargain MOM may process information you submit, such as an email address used for a newsletter signup. The site may also record limited technical and usage information, including page paths, search activity, and outbound affiliate-click context. It should not intentionally include sensitive admin data in public analytics.\n\nAnalytics or tag-management services are used only when configured by the site operator. Those services and external retailers may process information under their own privacy policies.\n\nOutbound links take you to third-party websites that Bargain MOM does not control. Review their privacy and cookie practices before providing information. Site operators should update this policy to name the actual services and legal contact details before production launch.",
  },
  {
    title: "Terms of Use",
    slug: "terms",
    intro: "These terms describe the informational role and limitations of Bargain MOM.",
    description: "Review the terms for using Bargain MOM's editorial shopping content and external retailer links.",
    content: "Bargain MOM provides general informational and editorial shopping content. It is not a retailer, payment processor, product manufacturer, professional adviser, or party to a transaction completed on an external website.\n\nProduct details, prices, availability, ratings, and retailer terms can change. Verify material information with the retailer or manufacturer before relying on it. Content is not a substitute for professional safety, medical, legal, or financial advice.\n\nProduct names and trademarks belong to their respective owners. The site operator should review these terms and add jurisdiction-specific legal details before a production launch.",
  },
];
for (let index = 0; index < trustPages.length; index += 1) {
  const page = trustPages[index];
  const data = {
    title: page.title,
    intro: page.intro,
    content: page.content,
    status: "ACTIVE" as const,
    publishedAt: CONTENT_DATE,
    seoTitle: `${page.title} | Bargain MOM`,
    seoDescription: page.description,
    robotsIndex: true,
    robotsFollow: true,
    schemaEnabled: page.slug === "howto",
  };
  await prisma.editorialPage.upsert({ where: { slug: page.slug }, update: data, create: { ...data, slug: page.slug } });
}

const navItems = [
  { id: "seed-nav-home", label: "Home", url: "/", sortOrder: 0 },
  { id: "seed-nav-deals", label: "Deals", url: "/deals", sortOrder: 1 },
  { id: "seed-nav-categories", label: "Categories", url: "/categories", sortOrder: 2 },
  { id: "seed-nav-stores", label: "Stores", url: "/stores", sortOrder: 3 },
  { id: "seed-nav-guides", label: "Buying Guides", url: "/guides", sortOrder: 4 },
  { id: "seed-nav-compare", label: "Comparisons", url: "/compare", sortOrder: 5 },
  { id: "seed-nav-blog", label: "Blog", url: "/blog", sortOrder: 6 },
  { id: "seed-nav-about", label: "About", url: "/about", sortOrder: 7 },
];
for (const navItem of navItems) {
  await prisma.navigationItem.upsert({
    where: { id: navItem.id },
    update: { ...navItem, active: true, parentId: null },
    create: { ...navItem, active: true },
  });
}
await prisma.navigationItem.upsert({
  where: { id: "seed-nav-promo-guide" },
  update: { label: "Promo Code Guide", url: "/howto", sortOrder: 0, active: true, parentId: "seed-nav-guides" },
  create: { id: "seed-nav-promo-guide", label: "Promo Code Guide", url: "/howto", sortOrder: 0, active: true, parentId: "seed-nav-guides" },
});

const footerSections = [
  {
    id: "seed-footer-shop",
    title: "Shop and research",
    sortOrder: 0,
    links: json([
      { id: "footer-deals", label: "Deals", url: "/deals" },
      { id: "footer-categories", label: "Categories", url: "/categories" },
      { id: "footer-stores", label: "Stores", url: "/stores" },
      { id: "footer-guides", label: "Buying Guides", url: "/guides" },
      { id: "footer-howto", label: "Promo Code Guide", url: "/howto" },
      { id: "footer-compare", label: "Comparisons", url: "/compare" },
    ]),
  },
  {
    id: "seed-footer-editorial",
    title: "About our work",
    sortOrder: 1,
    links: json([
      { id: "footer-about", label: "About", url: "/about" },
      { id: "footer-contact", label: "Contact", url: "/contact" },
      { id: "footer-policy", label: "Editorial Policy", url: "/editorial-policy" },
      { id: "footer-selection", label: "How We Choose Deals", url: "/how-we-choose-deals" },
    ]),
  },
  {
    id: "seed-footer-legal",
    title: "Policies",
    sortOrder: 2,
    links: json([
      { id: "footer-disclosure", label: "Affiliate Disclosure", url: "/affiliate-disclosure" },
      { id: "footer-privacy", label: "Privacy", url: "/privacy" },
      { id: "footer-terms", label: "Terms", url: "/terms" },
    ]),
  },
];
for (const footerSection of footerSections) {
  await prisma.footerSection.upsert({
    where: { id: footerSection.id },
    update: { ...footerSection, active: true },
    create: { ...footerSection, active: true },
  });
}

console.log(
  `Demo seed complete: ${stores.size} stores, ${categories.size} categories, ${brands.size} brands, ${products.length} noindex products, ${guideSeed.length} guides, ${comparisonSeed.length} comparisons, and ${trustPages.length} trust pages.`,
);
await prisma.$disconnect();
