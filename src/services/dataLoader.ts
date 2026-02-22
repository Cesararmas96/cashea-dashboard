import type { ClientOrder } from '../types/client'
import type { Merchant } from '../types/merchant'
import type { StorePaymentMethods } from '../types/store'

const cache = new Map<string, Promise<unknown>>()

function cachedFetch<T>(url: string): Promise<T> {
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url).then((r) => {
        if (!r.ok) throw new Error(`No encontrado: ${url}`)
        return r.json()
      })
    )
  }
  return cache.get(url) as Promise<T>
}

export function loadClient(identifierNumber: number): Promise<ClientOrder> {
  return cachedFetch<ClientOrder>(`/SAMPLE_CLIENT/${identifierNumber}.json`)
}

export function loadMerchant(id: number): Promise<Merchant> {
  return cachedFetch<Merchant>(`/SAMPLE_MERCHANTS/${id}.json`)
}

export function loadStore(id: number): Promise<StorePaymentMethods> {
  return cachedFetch<StorePaymentMethods>(`/SAMPLE_STORE/store_${id}.json`)
}

export interface MerchantIndexItem { id: number; name: string; category: string; enabled: boolean; type: string; locations?: { lat: number, lng: number, name: string }[]; }
export interface StoreIndexItem { id: number; methodCount: number; types: string[]; }
export interface OrderIndexItem { id: string; identifierNumber: number; amount: number; status: string; channel: string; customerName: string | null; createdAt: string | null; }

export function loadMerchantsIndex(): Promise<MerchantIndexItem[]> {
  return cachedFetch<MerchantIndexItem[]>('/merchants_index.json')
}

export function loadStoresIndex(): Promise<StoreIndexItem[]> {
  return cachedFetch<StoreIndexItem[]>('/stores_index.json')
}

export function loadOrdersIndex(): Promise<OrderIndexItem[]> {
  return cachedFetch<OrderIndexItem[]>('/orders_index.json')
}
