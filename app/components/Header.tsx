"use client";
import Link from "next/link";
import { useState } from "react";
import type { NavItem, SiteSettings } from "../lib/types";
import { SafeImage } from "./SafeImage";

export function Header({navigation,settings}:{navigation:NavItem[];settings:SiteSettings}){
  const [open,setOpen]=useState(false);const name=settings.websiteName||"Bargain MOM";const logo=settings.logo||"/brand/bargain-mom-logo.webp";
  return <header className="header"><Link className="brand brand-logo" href="/" aria-label={`${name} home`}><SafeImage src={logo} alt={`${name} logo`} width={190} height={80} sizes="190px" priority/></Link><nav id="primary-navigation" className={open?"nav open":"nav"} aria-label="Main navigation">{navigation.map(item=><div className="nav-entry" key={item.id}><Link href={item.url}>{item.label}{item.children?.length?<span>⌄</span>:null}</Link>{item.children?.length?<div className="nav-dropdown">{item.children.map(child=><Link href={child.url} key={child.id}>{child.label}</Link>)}</div>:null}</div>)}</nav><form className="header-search" action="/search"><input name="q" aria-label="Search products" placeholder={settings.searchPlaceholder||"Search products, brands or categories..."}/><button aria-label="Search">⌕</button></form><Link className="today-deals" href={settings.headerCtaUrl||"/deals"}>◆ {settings.headerCtaLabel||"Today’s Deals"}</Link><button className="menu" onClick={()=>setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open} aria-controls="primary-navigation">{open?"×":"☰"}</button></header>
}
