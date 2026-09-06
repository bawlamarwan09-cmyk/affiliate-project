"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";

const POPUP_DELAY_MS = 8_000;

export function DealsEmailPopupLoader({ label, description }: { label?: string | null; description?: string | null }) {
  const [Popup, setPopup] = useState<ComponentType<{ label?: string | null; description?: string | null; delayMs?: number }> | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void import("./DealsEmailPopup").then(module => setPopup(() => module.DealsEmailPopup));
    }, POPUP_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);
  return Popup ? <Popup label={label} description={description} delayMs={0} /> : null;
}
