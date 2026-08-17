import Link from "next/link";
export function AffiliateDisclosure({text}:{text?:string|null}){const disclosure=text?.trim()||"We may earn a commission when you buy through eligible links, at no added cost to you.";return <aside className="inline-disclosure"><b>Affiliate disclosure:</b> {disclosure} <Link href="/affiliate-disclosure">Learn how our links work.</Link></aside>}
