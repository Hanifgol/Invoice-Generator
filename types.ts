
export interface InvoiceItem {
  date: string;
  description: string;
  timeIn?: string;
  timeOut?: string;
  amount: number;
}

export type InvoiceStatus = 'PAID' | 'PENDING' | 'OVERDUE';

export interface InvoiceData {
  invoiceNumber?: string;
  clientName: string;
  clientAddress?: string;
  invoiceDate: string;
  items: InvoiceItem[];
  subtotal: number;
  totalAmount: number;
  closingMessage: string;
  status: InvoiceStatus;
}

export interface Client {
  id: string;
  name: string;
  address: string;
  lastSeen: number;
}

export interface ArchivedInvoice {
  id: string;
  createdAt: number;
  data: InvoiceData;
}

export type InvoiceTemplateType = 'executive' | 'modern' | 'classic';

export interface CompanyProfile {
  companyName: string;
  companyAddress: string;
  email: string;
  phone: string;
  website: string;
  taxId: string;
  bankDetails: string;
  logoBase64: string | null;
  signatureBase64: string | null;
  brandColor: string;
  currencySymbol: string;
  termsAndConditions: string;
  selectedTemplate: InvoiceTemplateType;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}