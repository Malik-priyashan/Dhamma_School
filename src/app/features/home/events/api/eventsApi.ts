export type HomeEventsApiItem = Record<string, unknown>;

export async function fetchHomeEvents(): Promise<HomeEventsApiItem[]> {
  const res = await fetch("/api/proxy/events", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Failed to load events with status ${res.status}`);
  }

  const data = await res.json();

  if (Array.isArray(data)) return data as HomeEventsApiItem[];

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const possibleLists = [record.data, record.items, record.results, record.events];

    for (const candidate of possibleLists) {
      if (Array.isArray(candidate)) return candidate as HomeEventsApiItem[];
    }
  }

  return [];
}