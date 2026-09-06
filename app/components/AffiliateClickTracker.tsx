"use client";

import { useEffect } from "react";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
type AnalyticsWindow = Window & { dataLayer?: Record<string, unknown>[]; __bargainMomDirectGa?: boolean; gtag?: (command: string, event: string, values: Record<string, unknown>) => void };

export function AffiliateClickTracker() {
  useEffect(() => {
    function track(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-affiliate-link]") : null;
      if (!target) return;
      const payload = { affiliateLinkId: target.dataset.affiliateLinkId, productId: target.dataset.productId, productName: target.dataset.productName, storeId: target.dataset.storeId, storeName: target.dataset.storeName, placement: target.dataset.placement, pagePath: location.pathname };
      void fetch(`${apiBase}/analytics/affiliate-click`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload), keepalive: true }).catch(() => {});
      const values = { product_id: payload.productId, product_name: payload.productName, store: payload.storeName, placement: payload.placement, page_path: payload.pagePath };
      const analytics = window as AnalyticsWindow;
      analytics.dataLayer = analytics.dataLayer || [];
      analytics.dataLayer.push({ event: "affiliate_click", ...values });
      if (analytics.__bargainMomDirectGa && typeof analytics.gtag === "function") analytics.gtag("event", "affiliate_click", values);
    }
    document.addEventListener("click", track);
    return () => document.removeEventListener("click", track);
  }, []);
  return null;
}
