export type HomeNewsApiItem = Record<string, unknown>;

type NewsPage = {
  items: HomeNewsApiItem[];
  totalPages: number;
};

async function fetchNewsPage(page: number, limit: number, signal?: AbortSignal): Promise<NewsPage> {
  const res = await fetch(`/api/proxy/news?page=${page}&limit=${limit}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Failed to load news with status ${res.status}`);
  }

  const data = await res.json();

  if (Array.isArray(data)) return { items: data as HomeNewsApiItem[], totalPages: 1 };

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const possibleLists = [record.data, record.items, record.results, record.news];
    const totalPages = Number(record.totalPages);

    for (const candidate of possibleLists) {
      if (Array.isArray(candidate)) {
        return {
          items: candidate as HomeNewsApiItem[],
          totalPages: Number.isSafeInteger(totalPages) && totalPages > 0 ? totalPages : 1,
        };
      }
    }
  }

  throw new Error("Unexpected news response format");
}

export async function fetchHomeNews({ all = false, signal }: { all?: boolean; signal?: AbortSignal } = {}): Promise<HomeNewsApiItem[]> {
  const limit = all ? 30 : 3;
  const firstPage = await fetchNewsPage(1, limit, signal);
  if (!all || firstPage.totalPages <= 1) return firstPage.items;

  const items = [...firstPage.items];
  for (let start = 2; start <= firstPage.totalPages; start += 5) {
    const pageNumbers = Array.from(
      { length: Math.min(5, firstPage.totalPages - start + 1) },
      (_, index) => start + index,
    );
    const pages = await Promise.all(pageNumbers.map((page) => fetchNewsPage(page, limit, signal)));
    for (const page of pages) items.push(...page.items);
  }

  return items;
}
