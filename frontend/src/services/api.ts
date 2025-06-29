import axios from 'axios'
import type { User, Product, Receipt, ReceiptItem, MedicalExpense, TaxSummary, TaxProfile, TaxProfileRequest } from '../types'

const API_BASE_URL = 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth endpoints
export const authAPI = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },
  
  register: async (email: string, password: string, name: string): Promise<{ user: User; token: string }> => {
    const response = await api.post('/auth/register', { email, password, name })
    return response.data
  },
  
  me: async (): Promise<User> => {
    const response = await api.get('/auth/me')
    return response.data
  },
}

// Products endpoints
export const productsAPI = {  getAll: async (): Promise<Product[]> => {
    const response = await api.get('/products?limit=1000')
    return response.data
  },
  
  create: async (product: Omit<Product, 'id' | 'createdAt' | 'userId'>): Promise<Product> => {
    const response = await api.post('/products', product)
    return response.data
  },
  
  update: async (id: string, product: Partial<Product>): Promise<Product> => {
    const response = await api.put(`/products/${id}`, product)
    return response.data
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`)
  },
}

// Receipts endpoints
export const receiptsAPI = {
  getAll: async (): Promise<Receipt[]> => {
    const response = await api.get('/receipts')
    return response.data
  },
    create: async (receipt: Omit<Receipt, 'id' | 'createdAt' | 'userId' | 'items'> & {
    items: Array<Omit<ReceiptItem, 'id' | 'receiptId'>>
  }): Promise<Receipt> => {
    const response = await api.post('/receipts', receipt)
    return response.data
  },
  
  update: async (id: string, receipt: Partial<Omit<Receipt, 'items'>> & {
    items?: Array<Omit<ReceiptItem, 'id' | 'receiptId'>>
  }): Promise<Receipt> => {
    const response = await api.put(`/receipts/${id}`, receipt)
    return response.data
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/receipts/${id}`)
  },
  
  uploadImage: async (file: File): Promise<{imageUrl: string, imageFileName: string, imageMimeType: string, imageSize: number, filePath: string}> => {
    const formData = new FormData()
    formData.append('receiptImage', file)
    
    const response = await api.post('/receipts/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    })
    return response.data.data
  },
}

// Medical expenses endpoints
export const medicalAPI = {
  getAll: async (): Promise<MedicalExpense[]> => {
    const response = await api.get('/medical')
    return response.data
  },
  
  create: async (expense: Omit<MedicalExpense, 'id' | 'createdAt' | 'userId'>): Promise<MedicalExpense> => {
    const response = await api.post('/medical', expense)
    return response.data
  },
  
  update: async (id: string, expense: Partial<MedicalExpense>): Promise<MedicalExpense> => {
    const response = await api.put(`/medical/${id}`, expense)
    return response.data
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/medical/${id}`)
  },
}

// Tax summary endpoint
export const taxAPI = {
  getSummary: async (year?: number): Promise<TaxSummary> => {
    const params = year ? { year } : {}
    const response = await api.get('/tax/summary', { params })
    return response.data
  },
  
  getTaxProfile: async (year: number): Promise<TaxProfile> => {
    const response = await api.get(`/tax/profile/${year}`)
    return response.data.data
  },
  
  saveTaxProfile: async (profile: TaxProfileRequest): Promise<TaxProfile> => {
    const response = await api.put('/tax/profile', profile)
    return response.data.data
  },
}

export default api
