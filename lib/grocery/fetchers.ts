export interface PriceResult {
  name: string
  price: number
  unit?: string
}

type Fetcher = (query: string) => Promise<PriceResult | null>

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const BASE_HEADERS = { 'User-Agent': UA, 'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8' }
const TIMEOUT = 8000

function extractPrice(obj: Record<string, unknown>): number | null {
  const candidates = [
    obj?.price,
    (obj?.price as any)?.price,
    (obj?.price as any)?.value,
    obj?.Price,
    obj?.unitPrice,
    obj?.regularPrice,
    obj?.finalPrice,
  ]
  for (const c of candidates) {
    const n = Number(c)
    if (!isNaN(n) && n > 0) return n
  }
  return null
}

function extractName(obj: Record<string, unknown>, fallback: string): string {
  return (obj?.name ?? obj?.Name ?? obj?.displayName ?? obj?.title ?? fallback) as string
}

export const fetchShufersal: Fetcher = async (query) => {
  try {
    // Shufersal uses SAP Commerce / OCC backend
    const url = `https://www.shufersal.co.il/online/he/search?q=${encodeURIComponent(query)}&pageSize=3&currentPage=0`
    const res = await fetch(url, {
      headers: { ...BASE_HEADERS, Accept: 'application/json, text/html, */*' },
      signal: AbortSignal.timeout(TIMEOUT),
    })
    if (!res.ok) return null
    const text = await res.text()

    try {
      const data = JSON.parse(text)
      const items: any[] = data?.results ?? data?.products?.results ?? data?.products ?? []
      if (!items.length) return null
      const item = items[0]
      const price = extractPrice(item)
      if (price === null) return null
      return { name: extractName(item, query), price, unit: item?.unit as string | undefined }
    } catch {}

    // Fallback: extract from JSON embedded in HTML
    const match = text.match(/"price"\s*:\s*\{[^}]*"value"\s*:\s*([\d.]+)/)
    const nameMatch = text.match(/"name"\s*:\s*"([^"]{3,80})"/)
    if (match && nameMatch) {
      return { name: nameMatch[1], price: parseFloat(match[1]) }
    }
    return null
  } catch {
    return null
  }
}

export const fetchRamiLevy: Fetcher = async (query) => {
  try {
    const url = `https://www.rami-levy.co.il/api/sale/items?q=${encodeURIComponent(query)}&limit=3&from=0`
    const res = await fetch(url, {
      headers: { ...BASE_HEADERS, Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT),
    })
    if (!res.ok) return null
    const data: any = await res.json()
    const items: any[] = data?.data ?? data?.items ?? data?.products ?? []
    if (!items.length) return null
    const item = items[0]
    const price = extractPrice(item)
    if (price === null) return null
    return { name: extractName(item, query), price, unit: item?.unit as string | undefined }
  } catch {
    return null
  }
}

export const fetchVictory: Fetcher = async (query) => {
  try {
    const url = `https://www.victoryonline.co.il/api/products?search=${encodeURIComponent(query)}&page=1&pageSize=3`
    const res = await fetch(url, {
      headers: { ...BASE_HEADERS, Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT),
    })
    if (!res.ok) return null
    const data: any = await res.json()
    const items: any[] = data?.products ?? data?.data ?? data?.items ?? []
    if (!items.length) return null
    const item = items[0]
    const price = extractPrice(item)
    if (price === null) return null
    return { name: extractName(item, query), price }
  } catch {
    return null
  }
}

export const fetchYeinotBitan: Fetcher = async (query) => {
  try {
    const url = `https://www.yba.co.il/api/products?search=${encodeURIComponent(query)}&limit=3`
    const res = await fetch(url, {
      headers: { ...BASE_HEADERS, Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT),
    })
    if (!res.ok) return null
    const data: any = await res.json()
    const items: any[] = data?.products ?? data?.data ?? []
    if (!items.length) return null
    const item = items[0]
    const price = extractPrice(item)
    if (price === null) return null
    return { name: extractName(item, query), price }
  } catch {
    return null
  }
}

export const SUPERMARKETS: Array<{
  id: string
  name: string
  website: string
  fetcher: Fetcher
  searchPath: string
}> = [
  {
    id: 'shufersal',
    name: 'שופרסל',
    website: 'https://www.shufersal.co.il',
    searchPath: '/online/he/search?q=',
    fetcher: fetchShufersal,
  },
  {
    id: 'rami-levy',
    name: 'רמי לוי',
    website: 'https://www.rami-levy.co.il',
    searchPath: '/he/search?q=',
    fetcher: fetchRamiLevy,
  },
  {
    id: 'victory',
    name: 'ויקטורי',
    website: 'https://www.victoryonline.co.il',
    searchPath: '/search?q=',
    fetcher: fetchVictory,
  },
  {
    id: 'yeinot-bitan',
    name: 'יינות ביתן',
    website: 'https://www.yba.co.il',
    searchPath: '/search?q=',
    fetcher: fetchYeinotBitan,
  },
]
