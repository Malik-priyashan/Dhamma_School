export type HomeNewsApiItem = Record<string, unknown>;

export async function fetchHomeNews(): Promise<HomeNewsApiItem[]> {
  const res = await fetch("/api/proxy/news", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Failed to load news with status ${res.status}`);
  }

  const data = await res.json();

  if (Array.isArray(data)) return data as HomeNewsApiItem[];

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const possibleLists = [record.data, record.items, record.results, record.news];

    for (const candidate of possibleLists) {
      if (Array.isArray(candidate)) return candidate as HomeNewsApiItem[];
    }
  }

  return [];
}