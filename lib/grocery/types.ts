export interface ProductResult {
  query: string
  found: { name: string; price: number; unit?: string } | null
}

export interface SupermarketResult {
  id: string
  name: string
  website: string
  searchUrl: string
  products: ProductResult[]
  total: number
  foundCount: number
  missingCount: number
}

export interface CompareResponse {
  supermarkets: SupermarketResult[]
  cheapestId: string | null
}
