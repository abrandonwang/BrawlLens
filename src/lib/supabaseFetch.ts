// PostgREST silently caps responses at ~1000 rows by default. When a route
// reads an entire table without filters, the missing rows produce wrong
// aggregations (e.g. brawler totals computed on the first 1k of 14k rows).
// Use this helper to page through with stable ordering.

const DEFAULT_PAGE_SIZE = 1000

type RangeQuery<T> = {
  range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
}

export async function fetchAllPaged<T>(
  buildQuery: () => RangeQuery<T>,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<{ data: T[]; error: { message: string } | null }> {
  const all: T[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1)
    if (error) return { data: all, error }
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < pageSize) break
  }
  return { data: all, error: null }
}
