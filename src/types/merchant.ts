export interface MerchantStore {
  createdAt: string
  updatedAt: string
  id: number
  merchantId: number
  name: string
  statusId: number
  featured: boolean
  orderType: 'SPLIT' | 'DAILY'
  channels: string[]
  isPhysical: boolean
  merchantGroupId: number | null
  minimumDownPayment: number | null
  minimumFinanceableAmount: number | null
  legalEntityId: number | null
  address: {
    name: string
    long: number
    lat: number
    location: string
    shipmentsEnabled: boolean
  }
}

export interface InstallmentPlan {
  id: number
  name: string
  type: 'SPLIT' | 'DAILY'
  isPublic: boolean
  description: string
  data: {
    minimumLevel: number
    installmentsAmount: number
    installmentsFrequency: { unit: string; number: number }
    installmentGracePeriod: number
    installmentFirstPayment: number
    installmentsInterestRate: number
    financedAmountMultiplier?: number
  }
}

export interface Merchant {
  createdAt: string
  updatedAt: string
  id: number
  name: string
  ecommerceUrl: string | null
  changePolicy: string
  email: string | null
  phoneNumber: string | null
  logoUrl: string | null
  description: string | null
  enabled: boolean
  featured: boolean
  type: 'SPLIT' | 'DAILY'
  minimumDownPayment: number
  channels: string[]
  parentGroupId: number | null
  uuid: string
  shipmentPolicy: string | null
  workingHours: { from: string; to: string }
  contact: {
    email: string
    legalName: string
    phoneNumber: string
  }
  stores: MerchantStore[]
  installmentPlansAvailable: InstallmentPlan[]
  category: string
  shipmentOptionsAvailable: unknown[]
}
