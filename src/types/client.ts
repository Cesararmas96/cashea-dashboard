export interface Installment {
  id: string
  installmentNumber: number
  scheduledPaymentDate: string
  amount: number
  status: 'DONE' | 'DELAYED' | 'CANCELLED' | string
}

export interface ClientOrder {
  createdAt: string
  id: string
  amount: number
  invoiceId: string | null
  paidToMerchant: boolean
  identifierNumber: number
  billingDate: string
  channel: 'IN_STORE' | 'IN_APP'
  deliveryStatus: string
  status: 'CLOSED' | 'CANCELLED' | 'OPEN' | 'IN_PROGRESS'
  statusName: string
  data: {
    lastPosId: string | null
    buyDebtDate: string
    lastStoreId: number
    boughtForInstallmentId: string
    boughtForInstallmentNumber: number
  } | null
  downPaymentPaidAt: string | null
  paymentDetails: {
    user: {
      identificationNumber: string
      fullName: string
      phoneNumber: string
    }
    installments: Installment[]
  } | null
  store: {
    id: number
    name: string
  }
  orderProducts: {
    quantity: number
    productId: number
    name: string | null
    price: number | null
    priceAfterDiscount: number | null
  }[]
  shipment: null
}
