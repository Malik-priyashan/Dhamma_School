const protectedPaths: Record<string, string> = {
  "auth/login": "login",
  "auth/registration-email/send": "registration_email_send",
};

export function recaptchaAction(method: string, path: string[]) {
  return method === "POST" ? protectedPaths[path.join("/")] : undefined;
}

export async function verifyRecaptcha(token: string, requestHostname: string, expectedAction: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret || !token) return false;

  const body = new URLSearchParams({ secret, response: token });
  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;
    const result = await response.json() as {
      success?: boolean;
      hostname?: string;
      action?: string;
      score?: number;
      "error-codes"?: string[];
    };
    return result.success === true &&
      result.hostname?.toLowerCase() === requestHostname.toLowerCase() &&
      result.action === expectedAction &&
      typeof result.score === "number" && result.score >= 0.5 &&
      !result["error-codes"]?.includes("Over free quota.");
  } catch {
    return false;
  }
}
