type RecaptchaApi = {
  ready: (callback: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
};

declare global {
  interface Window { grecaptcha?: RecaptchaApi }
}

const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

async function withTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error("reCAPTCHA did not respond. Please try again.")), 10000);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function getRecaptchaToken(action: "login" | "registration_email_send") {
  if (!siteKey) return "";

  // The site-wide script loads after hydration; a fast form submission may precede it.
  const deadline = Date.now() + 10000;
  while (!window.grecaptcha && Date.now() < deadline) {
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
  }
  if (!window.grecaptcha) throw new Error("reCAPTCHA did not load. Please try again.");

  const grecaptcha = window.grecaptcha;
  await withTimeout(new Promise<void>((resolve) => grecaptcha.ready(resolve)));
  const token = await withTimeout(grecaptcha.execute(siteKey, { action }));
  if (!token) throw new Error("reCAPTCHA verification failed. Please try again.");
  return token;
}
