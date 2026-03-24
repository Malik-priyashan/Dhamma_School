export async function getMessages(locale: string) {
  try {
    const msgs = await import(`./message/${locale}.json`);
    return msgs.default ?? msgs;
  } catch {
    const fallback = await import("./message/en.json");
    return fallback.default ?? fallback;
  }
}
