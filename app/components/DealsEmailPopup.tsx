"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type AnalyticsWindow = Window & {
  dataLayer?: Record<string, unknown>[];
  __bargainMomDirectGa?: boolean;
  gtag?: (command: string, eventName: string, values: Record<string, unknown>) => void;
};

type PopupState = "idle" | "submitting" | "success" | "error";

const POPUP_DELAY_MS = 8_000;
const DISMISSAL_TTL_MS = 7 * 24 * 60 * 60 * 1_000;
const STORAGE_KEY = "bargain-mom:deals-email-popup:v1";

function remember(state: "dismissed" | "subscribed") {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, savedAt: Date.now() }));
  } catch {
    // Storage may be unavailable in privacy-focused browsers; the form still works.
  }
}

function shouldSuppressPopup() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw) as { state?: string; savedAt?: number };
    if (saved.state === "subscribed") return true;
    return saved.state === "dismissed"
      && typeof saved.savedAt === "number"
      && Date.now() - saved.savedAt < DISMISSAL_TTL_MS;
  } catch {
    return false;
  }
}

export function DealsEmailPopup({
  label,
  description,
}: {
  label?: string | null;
  description?: string | null;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<PopupState>("idle");
  const [message, setMessage] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const successTimer = useRef<number | null>(null);
  const subscribed = useRef(false);

  const dismiss = useCallback(() => {
    if (!subscribed.current) remember("dismissed");
    setOpen(false);
  }, []);

  useEffect(() => {
    if (isAdmin || shouldSuppressPopup()) return;
    const timer = window.setTimeout(() => setOpen(true), POPUP_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isAdmin]);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusTimer = window.setTimeout(() => emailRef.current?.focus(), 80);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      previousFocus.current?.focus();
    };
  }, [dismiss, open]);

  useEffect(() => () => {
    if (successTimer.current) window.clearTimeout(successTimer.current);
  }, []);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") || "").trim().toLowerCase();
    setState("submitting");
    setMessage("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/newsletter`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error("Subscription failed");

      subscribed.current = true;
      remember("subscribed");
      setState("success");
      setMessage("You’re on the list! Watch your inbox for new deal updates.");
      const values = { placement: "email_popup", page_path: window.location.pathname };
      const analytics = window as AnalyticsWindow;
      analytics.dataLayer = analytics.dataLayer || [];
      analytics.dataLayer.push({ event: "newsletter_signup", ...values });
      if (analytics.__bargainMomDirectGa && typeof analytics.gtag === "function") {
        analytics.gtag("event", "newsletter_signup", values);
      }
      successTimer.current = window.setTimeout(() => setOpen(false), 2_400);
    } catch {
      setState("error");
      setMessage("We couldn’t add you right now. Please try again.");
    }
  }

  if (!open || isAdmin) return null;

  return (
    <div
      className="deals-popup-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <section
        className="deals-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deals-popup-title"
        aria-describedby="deals-popup-description"
      >
        <button className="deals-popup-close" type="button" onClick={dismiss} aria-label="Close email signup">
          ×
        </button>
        <div className="deals-popup-art" aria-hidden="true">
          <span className="deals-popup-spark">✦</span>
          <div className="deals-popup-tag"><small>FIND</small><strong>SMART</strong><small>DEALS</small></div>
          <i className="deals-popup-orbit deals-popup-orbit-one" />
          <i className="deals-popup-orbit deals-popup-orbit-two" />
        </div>
        <div className="deals-popup-content">
          <span className="deals-popup-eyebrow">{label || "Deals & shopping notes"}</span>
          <h2 id="deals-popup-title">Get smarter deals in your inbox.</h2>
          <p id="deals-popup-description">
            {description || "Get useful deal updates and practical shopping guidance when we publish them."}
          </p>
          {state === "success" ? (
            <div className="deals-popup-success" role="status">
              <span aria-hidden="true">✓</span>
              <p>{message}</p>
            </div>
          ) : (
            <form onSubmit={subscribe}>
              <label htmlFor="deals-popup-email">Email address</label>
              <div className="deals-popup-form-row">
                <input
                  ref={emailRef}
                  id="deals-popup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  required
                  disabled={state === "submitting"}
                />
                <button type="submit" disabled={state === "submitting"}>
                  {state === "submitting" ? "Joining…" : "Send me deals"}
                </button>
              </div>
              {message ? <p className="deals-popup-message" role="alert">{message}</p> : null}
              <small id="deals-popup-privacy">
                No spam. Unsubscribe anytime. See our <Link href="/privacy">privacy policy</Link>.
              </small>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
