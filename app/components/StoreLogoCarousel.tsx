"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Store } from "../lib/types";
import { SafeImage } from "./SafeImage";

type StoreLogo = Pick<Store, "id" | "name" | "slug" | "logo">;
const AUTO_SCROLL_DELAY_MS = 2_500;

function scrollStep(track: HTMLDivElement) {
  const firstStore = track.firstElementChild;
  return firstStore instanceof HTMLElement ? firstStore.offsetWidth : Math.max(180, track.clientWidth * 0.4);
}

export function StoreLogoCarousel({ title, subtitle, stores }: { title?: string; subtitle?: string; stores: StoreLogo[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: false, right: true });
  const [paused, setPaused] = useState(false);

  const updatePosition = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const next = { left: track.scrollLeft > 4, right: track.scrollLeft < maxScroll - 4 };
    setPosition((current) => current.left === next.left && current.right === next.right ? current : next);
  }, []);

  useEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [updatePosition]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || paused || stores.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      if (maxScroll <= 4) return;
      const atEnd = track.scrollLeft >= maxScroll - 4;
      track.scrollTo({
        left: atEnd ? 0 : Math.min(maxScroll, track.scrollLeft + scrollStep(track)),
        behavior: "smooth",
      });
    }, AUTO_SCROLL_DELAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, stores.length]);

  function move(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * Math.max(240, track.clientWidth * 0.72), behavior: "smooth" });
  }

  return <section
    className="store-logo-rail"
    aria-label={title || "Browse by store"}
    onFocusCapture={() => setPaused(true)}
    onBlurCapture={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
    }}
  >
    <div className="store-rail-heading"><strong>{title}</strong>{subtitle && <small>{subtitle}</small>}</div>
    <div className="store-carousel">
      <button className="store-scroll store-scroll-left" type="button" aria-label="Scroll stores left" disabled={!position.left} onClick={() => move(-1)}>‹</button>
      <div className="store-logo-track" ref={trackRef} onScroll={updatePosition}>
        {stores.map((store) => <Link href={`/store/${store.slug}`} key={store.id}>{store.logo ? <SafeImage src={store.logo} alt={`${store.name} logo`} width={132} height={48} sizes="132px"/> : <b>{store.name}</b>}</Link>)}
      </div>
      <button className="store-scroll store-scroll-right" type="button" aria-label="Scroll stores right" disabled={!position.right} onClick={() => move(1)}>›</button>
    </div>
  </section>;
}
