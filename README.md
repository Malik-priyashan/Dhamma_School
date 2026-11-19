This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Google reCAPTCHA setup

The site loads reCAPTCHA v3 and shows Google's badge in the bottom-right corner. Login and registration email-code requests obtain a fresh token when submitted. The Next.js API proxy verifies the token, hostname, action, and score (minimum 0.5) with Google before forwarding these requests. Both keys are required to activate it; if neither is set, these forms work as before and the badge is absent. If only one key is set, the protected requests return an error.

1. Open the [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin/create), sign in, and create a **Score based (v3)** key. A v2 checkbox key from the previous integration will not work; replace both keys with a matching v3 pair. This integration uses `api.js` and the classic `siteverify` endpoint, rather than the Enterprise assessment API.
2. Give it a label such as `Siri Sumanathissa Dhamma School`. Add `sirisumanathissadhammaschool.com` to **Domains**. Enter only the hostname, without `https://`, `www`, a path, or a port. Google's domain setting also covers `www.sirisumanathissadhammaschool.com`.
3. Keep domain validation enabled. Copy the **site key** and **secret key**. If Google shows a Cloud key page, find its **legacy secret key** under the Integration tab; the key must support the classic v3 API.
4. In the frontend hosting project, set `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` to the site key and `RECAPTCHA_SECRET_KEY` to the secret key. The secret is server-only; never prefix it with `NEXT_PUBLIC_`, add it to client code, or commit it. On Vercel, add both under **Project Settings → Environment Variables** for Production, then redeploy so the public key is included in the client build.
5. For local development, create a *separate* v3 key pair with `localhost` in its Domains list. Put its keys in the root `.env.local` and restart `npm run dev`. The app runs on `http://localhost:3001`.
6. After deployment, open `https://sirisumanathissadhammaschool.com/en/login` and `/en/register` (also test `/si/login` and `/si/register`). Confirm the Google badge appears at the bottom right on these pages and elsewhere on the site, and that normal login and email-code sending work. Check the reCAPTCHA console for `login` and `registration_email_send` actions and their score distribution. Low scores (below 0.5) are rejected. Preview deployment hostnames need their own allowed domain and key pair if those environments also use CAPTCHA.

**Backend protection:** The separately hosted backend is publicly reachable. This frontend proxy check does not prevent someone from calling the backend's `/auth/login` or `/auth/registration-email/send` routes directly. To close that path, the backend must require and verify reCAPTCHA on those endpoints, or restrict those endpoints so only a trusted proxy can invoke them. Because Google tokens are single-use, the same token cannot be verified independently by both proxy and backend; coordinate the handoff when updating the backend. Keep email-send rate limits and login rate limits in place as well.

## Getting Started

The footer displays the exact coordinates from the school's shared Google Maps pin and links to that location. To use the Google Maps Embed API, enable it in Google Cloud and set `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY` to a browser key restricted to your website and that API. Without a key, the footer uses a Google Maps embed of the same coordinates.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
