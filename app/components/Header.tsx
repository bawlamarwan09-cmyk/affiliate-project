"use client";
import Link from "next/link";
import { useState } from "react";
import type { NavItem, SiteSettings } from "../lib/types";

export function Header({ navigation, settings }: { navigation: NavItem[]; settings: SiteSettings }) {
  const [open, setOpen] = useState(false);
  const name = settings.websiteName || "Dealora";
  return <>
    <div className="announcement"><span>Independent picks. Transparent recommendations.</span><Link href="/affiliate-disclosure">How we earn</Link></div>
    <header className="header">
      <Link className="brand" href="/" aria-label={`${name} home`}><span className="brand-mark">D</span><span>{name}</span></Link>
      <nav className={open ? "nav open" : "nav"} aria-label="Main navigation">
        {navigation.map(item => <Link key={item.id} href={item.url}>{item.label}</Link>)}
      </nav>
      <div className="header-actions"><Link className="search-pill" href="/search" aria-label="Search">⌕ <span>Search deals</span><kbd>⌘ K</kbd></Link><button className="menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? "×" : "☰"}</button></div>
    </header>
  </>;
}
