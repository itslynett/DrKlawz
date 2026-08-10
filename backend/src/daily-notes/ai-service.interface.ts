import { ExtractionEntityType } from '@prisma/client';

export interface ExtractedExpense {
  category: string; // RENT, UTILITIES, MARKETING, PRODUCTS, etc.
  amount: number;
  notes: string;
}

export interface ExtractedIncome {
  clientName: string;
  serviceName: string;
  amount: number;
  paymentMethod: string; // CASH, CARD, BANK_TRANSFER, MOBILE_MONEY
  tips?: number;
  notes?: string;
}

export interface ExtractedInventory {
  productName: string;
  category: string;
  supplierName: string;
  quantityPurchased: number;
  unitCost: number;
}

export interface ExtractedEquipment {
  equipmentName: string;
  notes: string;
  maintenanceSchedule?: string;
  action: 'ORDERED' | 'REPLACE' | 'MAINTENANCE';
}

export interface NoteExtractionResult {
  expenses: ExtractedExpense[];
  incomes: ExtractedIncome[];
  inventory: ExtractedInventory[];
  equipment: ExtractedEquipment[];
  rawText: string;
}

export abstract class AIService {
  abstract extractEntitiesFromNote(rawText: string): Promise<NoteExtractionResult>;
}
