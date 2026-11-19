"use client";

import Script from "next/script";

const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function RecaptchaBadge() {
  if (!siteKey) return null;

  return (
    <Script
      id="google-recaptcha-v3"
      src={`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`}
      strategy="afterInteractive"
    />
  );
}
