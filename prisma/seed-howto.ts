import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import { howtoPageSeed } from "./howto-page-data.js";

const prisma = new PrismaClient();

try {
  const data = {
    title: howtoPageSeed.title,
    intro: howtoPageSeed.intro,
    content: howtoPageSeed.content,
    status: "ACTIVE" as const,
    publishedAt: new Date("2026-08-25T12:00:00.000Z"),
    seoTitle: `${howtoPageSeed.title} | Bargain MOM`,
    seoDescription: howtoPageSeed.description,
    robotsIndex: true,
    robotsFollow: true,
    schemaEnabled: true,
  };
  await prisma.editorialPage.upsert({
    where: { slug: howtoPageSeed.slug },
    update: data,
    create: { ...data, slug: howtoPageSeed.slug },
  });

  const guideNavigation = await prisma.navigationItem.findFirst({
    where: { OR: [{ id: "seed-nav-guides" }, { url: "/guides" }] },
    orderBy: { sortOrder: "asc" },
  });
  if (guideNavigation) {
    await prisma.navigationItem.upsert({
      where: { id: "seed-nav-promo-guide" },
      update: { label: "Promo Code Guide", url: "/howto", sortOrder: 0, active: true, parentId: guideNavigation.id },
      create: { id: "seed-nav-promo-guide", label: "Promo Code Guide", url: "/howto", sortOrder: 0, active: true, parentId: guideNavigation.id },
    });
  }

  const shopFooter = await prisma.footerSection.findUnique({ where: { id: "seed-footer-shop" } });
  const currentLinks = Array.isArray(shopFooter?.links) ? shopFooter.links : [];
  const hasGuideLink = currentLinks.some(
    (link) => link !== null && typeof link === "object" && !Array.isArray(link) && link.url === "/howto",
  );
  if (shopFooter && !hasGuideLink) {
    await prisma.footerSection.update({
      where: { id: shopFooter.id },
      data: {
        links: [
          ...currentLinks,
          { id: "footer-howto", label: "Promo Code Guide", url: "/howto" },
        ] as Prisma.InputJsonValue,
      },
    });
  }
  console.log("Promo code guide is ready at /howto.");
} finally {
  await prisma.$disconnect();
}
