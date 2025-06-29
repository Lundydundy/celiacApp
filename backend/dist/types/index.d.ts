import { Request } from 'express';
export interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface AuthenticatedRequest extends Request {
    user?: AuthUser;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
}
export interface ProductRequest {
    name: string;
    category: string;
    brand?: string;
    isGlutenFree: boolean;
    price?: number;
    notes?: string;
}
export interface ReceiptRequest {
    storeName: string;
    receiptDate: string;
    totalAmount: number;
    eligibleAmount: number;
    imageUrl?: string;
    imageFileName?: string;
    imageMimeType?: string;
    imageSize?: number;
    items: ReceiptItemRequest[];
}
export interface ReceiptItemRequest {
    name: string;
    price: number;
    quantity?: number;
    isEligible: boolean;
    purchasedProductId?: string;
    comparisonProductId?: string;
    comparisonPrice?: number;
    incrementalCost?: number;
}
export interface MedicalExpenseRequest {
    description: string;
    amount: number;
    date: string;
    category: 'consultation' | 'medication' | 'test' | 'supplement' | 'other';
    provider?: string;
    notes?: string;
}
export interface TaxSummaryResponse {
    totalEligibleAmount: number;
    totalMedicalExpenses: number;
    totalDeductible: number;
    receiptsCount: number;
    medicalExpensesCount: number;
    year: number;
}
export interface TaxProfileRequest {
    year: number;
    netIncome?: number;
    dependantIncome?: number;
    claimingFor?: 'self' | 'dependant';
}
export interface TaxProfileResponse {
    id: string;
    year: number;
    netIncome?: number;
    dependantIncome?: number;
    claimingFor: string;
    createdAt: string;
    updatedAt: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface PaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface FileUpload {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
}
//# sourceMappingURL=index.d.ts.map