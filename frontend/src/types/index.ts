export interface User {
  id: string
  email: string
  name: string
  createdAt: string
}

export interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  loading: boolean
}

export interface Product {
  id: string
  name: string
  category: string
  brand?: string
  isGlutenFree: boolean
  price?: number
  notes?: string
  
  // For comparison pricing
  regularPrice?: number      // Price of regular (gluten-containing) equivalent
  regularProductName?: string // Name of the regular equivalent product
  incrementalCost?: number    // Calculated difference (glutenFreePrice - regularPrice)
  
  createdAt: string
  userId: string
}

export interface Receipt {
  id: string
  storeName: string
  receiptDate: string
  totalAmount: number
  eligibleAmount: number
  imageUrl?: string
  imageFileName?: string
  imageMimeType?: string
  imageSize?: number
  items: ReceiptItem[]
  userId: string
  createdAt: string
}

export interface ReceiptItem {
  id: string
  name: string
  price: number
  quantity?: number
  isEligible: boolean
  receiptId: string
  productId?: string
  product?: Product
  
  // New fields for product comparison
  purchasedProductId?: string
  purchasedProduct?: Product
  comparisonProductId?: string
  comparisonProduct?: Product
  comparisonPrice?: number
  incrementalCost?: number
}

export interface MedicalExpense {
  id: string
  description: string
  amount: number
  date: string
  category: 'consultation' | 'medication' | 'test' | 'supplement' | 'other'
  provider?: string
  notes?: string
  userId: string
  createdAt: string
}

export interface TaxSummary {
  totalEligibleAmount: number
  totalMedicalExpenses: number
  totalDeductible: number
  receiptsCount: number
  medicalExpensesCount: number
  year: number
}

export interface TaxProfile {
  id: string
  year: number
  netIncome?: number
  dependantIncome?: number
  claimingFor: string
  createdAt: string
  updatedAt: string
}

export interface TaxProfileRequest {
  year: number
  netIncome?: number
  dependantIncome?: number
  claimingFor?: 'self' | 'dependant'
}

export interface TaxProfile {
  id: string
  year: number
  netIncome?: number
  dependantIncome?: number
  claimingFor: string
  createdAt: string
  updatedAt: string
}

export interface TaxProfileRequest {
  year: number
  netIncome?: number
  dependantIncome?: number
  claimingFor?: 'self' | 'dependant'
}
