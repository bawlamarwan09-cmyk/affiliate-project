"use client";

import { FormEvent, useState } from "react";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

type FormState = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    setState("submitting");
    setMessage("Sending your message…");

    try {
      const response = await fetch(`${apiBase}/contact`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: fields.get("name"),
          email: fields.get("email"),
          subject: fields.get("subject"),
          message: fields.get("message"),
          website: fields.get("website"),
        }),
      });

      if (!response.ok) throw new Error("The message could not be sent.");
      form.reset();
      setState("success");
      setMessage("Thanks — your message was received. We’ll review it as soon as possible.");
    } catch {
      setState("error");
      setMessage("We couldn’t send your message. Please check the fields and try again.");
    }
  }

  return (
    <form className="contact-form" onSubmit={submit} aria-describedby="contact-privacy contact-status">
      <div className="contact-field-row">
        <label htmlFor="contact-name">Name <span aria-hidden="true">*</span></label>
        <input id="contact-name" name="name" type="text" minLength={2} maxLength={120} autoComplete="name" required />
      </div>
      <div className="contact-field-row">
        <label htmlFor="contact-email">Email <span aria-hidden="true">*</span></label>
        <input id="contact-email" name="email" type="email" maxLength={254} autoComplete="email" required />
      </div>
      <div className="contact-field-row">
        <label htmlFor="contact-subject">Subject <span>Optional</span></label>
        <input id="contact-subject" name="subject" type="text" maxLength={160} />
      </div>
      <div className="contact-field-row">
        <label htmlFor="contact-message">Message <span aria-hidden="true">*</span></label>
        <textarea id="contact-message" name="message" minLength={10} maxLength={5000} rows={7} required />
      </div>
      <div className="contact-honeypot" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <p id="contact-privacy" className="contact-privacy">Do not send passwords, payment-card details, health records, or other sensitive information.</p>
      <button type="submit" disabled={state === "submitting"}>{state === "submitting" ? "Sending…" : "Send message"}</button>
      <p id="contact-status" className={`contact-status ${state}`} aria-live="polite">{message}</p>
    </form>
  );
}
