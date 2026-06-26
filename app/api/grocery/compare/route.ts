import { NextRequest, NextResponse } from 'next/server'
import { SUPERMARKETS } from '@/lib/grocery/fetchers'
import type { CompareResponse, SupermarketResult } from '@/lib/grocery/types'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  let products: string[]
  try {
    const body = await req.json()
    products = Array.isArray(body.products) ? body.products : []
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }

  products = products.map((p: string) => p.trim()).filter(Boolean).slice(0, 60)
  if (!products.length) {
    return NextResponse.json({ error: 'products array required' }, { status: 400 })
  }

  const supermarkets: SupermarketResult[] = await Promise.all(
    SUPERMARKETS.map(async (sm) => {
      const productResults = await Promise.all(
        products.map(async (query) => ({
          query,
          found: await sm.fetcher(query),
        }))
      )

      const foundItems = productResults.filter((p) => p.found !== null)
      const total = foundItems.reduce((sum, p) => sum + (p.found?.price ?? 0), 0)

      return {
        id: sm.id,
        name: sm.name,
        website: sm.website,
        searchUrl: sm.website + sm.searchPath + encodeURIComponent(products[0] ?? ''),
        products: productResults,
        total,
        foundCount: foundItems.length,
        missingCount: products.length - foundItems.length,
      }
    })
  )

  const withData = supermarkets.filter((s) => s.foundCount > 0)
  const cheapest = withData.length
    ? withData.reduce((min, s) => (s.total < min.total ? s : min)).id
    : null

  const response: CompareResponse = { supermarkets, cheapestId: cheapest }
  return NextResponse.json(response)
}
