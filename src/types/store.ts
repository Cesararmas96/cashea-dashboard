export type PaymentMethodType = 'MOBILE' | 'TRANSFER' | 'DEPOSIT' | null

export interface PaymentMethod {
  id: number
  name: string
  type: PaymentMethodType
  rif: string | null
  bankName: string | null
  bankHolder: string | null
  internalBankHolder: string | null
  account: string | null
  accountType: string | null
  phoneNumber: string | null
  currencyId: 1 | 2
  fees: unknown[]
  currency: {
    id: number
    name: 'VES' | 'USD'
  }
}

export type StorePaymentMethods = PaymentMethod[]
