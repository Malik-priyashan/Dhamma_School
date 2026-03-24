import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales } from "../config";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = (typeof requested === 'string' && (locales as readonly string[]).includes(requested)) ? (requested as typeof defaultLocale) : defaultLocale;

  const messages = await import(`../message/${locale}.json`);

  return {
    locale,
    messages: messages.default ?? messages,
  };
});
