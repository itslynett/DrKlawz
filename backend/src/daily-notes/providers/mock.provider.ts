import { Injectable } from '@nestjs/common';
import { AIService, NoteExtractionResult, ExtractedExpense, ExtractedIncome, ExtractedInventory, ExtractedEquipment } from '../ai-service.interface';

@Injectable()
export class MockProvider implements AIService {
  async extractEntitiesFromNote(rawText: string): Promise<NoteExtractionResult> {
    console.log('[MockProvider] Parsing raw text offline:', rawText);
    
    const expenses: ExtractedExpense[] = [];
    const incomes: ExtractedIncome[] = [];
    const inventory: ExtractedInventory[] = [];
    const equipment: ExtractedEquipment[] = [];

    const lower = rawText.toLowerCase();

    // 1. Regex for Payments / Incomes
    // Example: "Sarah came for Gel X and paid KSh 3,500" or "Jane came for Pedicure paid 2000"
    const incomeRegexes = [
      /([a-z\s]+)\s+(?:came for|had|got)\s+([a-z\s\d]+)\s+and\s+paid\s+(?:ksh|sh)?\s*([\d,]+)/i,
      /([a-z\s]+)\s+paid\s+(?:ksh|sh)?\s*([\d,]+)\s+for\s+([a-z\s\d]+)/i,
    ];

    for (const regex of incomeRegexes) {
      const match = lower.match(regex);
      if (match) {
        const clientName = this.capitalize(match[1].trim());
        const serviceName = this.capitalize(match[2].trim().includes('paid') ? match[3].trim() : match[2].trim());
        const amountStr = match[3].trim().includes('paid') ? match[2] : match[3];
        const amount = parseFloat(amountStr.replace(/,/g, ''));
        
        if (!isNaN(amount)) {
          incomes.push({
            clientName,
            serviceName,
            amount,
            paymentMethod: 'MOBILE_MONEY', // Default fallback
            notes: `Extracted customer visit: ${clientName} for ${serviceName}`,
          });
        }
        break; // matched one
      }
    }

    // Fallback search inside the example note if no regex matches
    if (incomes.length === 0 && lower.includes('sarah') && lower.includes('gel x')) {
      incomes.push({
        clientName: 'Sarah Jenkins',
        serviceName: 'Gel X Extension',
        amount: 3500,
        paymentMethod: 'MOBILE_MONEY',
        notes: 'Sarah came for Gel X and paid KSh 3,500',
      });
    }

    // 2. Regex for Expenses & Inventory Restock
    // Example: "Bought 4 nude gel polishes from Beauty World for KSh 3,200"
    const expenseRegex = /(?:bought|purchased|ordered)\s+(\d+)\s+([a-z\s\d]+)\s+from\s+([a-z\s\d]+)\s+for\s+(?:ksh|sh)?\s*([\d,]+)/i;
    const expenseMatch = lower.match(expenseRegex);
    if (expenseMatch) {
      const qty = parseInt(expenseMatch[1].trim());
      const productName = this.capitalize(expenseMatch[2].trim());
      const supplierName = this.capitalize(expenseMatch[3].trim());
      const totalCost = parseFloat(expenseMatch[4].replace(/,/g, ''));
      const unitCost = qty > 0 ? totalCost / qty : totalCost;

      expenses.push({
        category: 'PRODUCTS',
        amount: totalCost,
        notes: `Bought ${qty} ${productName} from ${supplierName}`,
      });

      inventory.push({
        productName,
        category: 'Consumables',
        supplierName,
        quantityPurchased: qty,
        unitCost,
      });
    } else {
      // Fallback search for example note
      if (lower.includes('beauty world') && (lower.includes('3,200') || lower.includes('3200'))) {
        expenses.push({
          category: 'PRODUCTS',
          amount: 3200,
          notes: 'Bought 4 nude gel polishes from Beauty World',
        });
        inventory.push({
          productName: 'Nude Gel Polish',
          category: 'Consumables',
          supplierName: 'Beauty World',
          quantityPurchased: 4,
          unitCost: 800,
        });
      }
    }

    // 3. Equipment ordered / replace
    // Example: "Ordered a new UV lamp"
    if (lower.includes('ordered a new') || lower.includes('bought a new')) {
      const equipRegex = /(?:ordered|bought)\s+a\s+new\s+([a-z\s\d]+)/i;
      const match = lower.match(equipRegex);
      if (match) {
        equipment.push({
          equipmentName: this.capitalize(match[1].trim()),
          notes: `Ordered a new ${match[1].trim()}`,
          action: 'ORDERED',
        });
      }
    } else if (lower.includes('uv lamp')) {
      equipment.push({
        equipmentName: 'UV LED Nail Lamp',
        notes: 'Ordered a new UV lamp',
        action: 'ORDERED',
      });
    }

    // Example: "Need to replace the old drill next month"
    if (lower.includes('replace the old') || lower.includes('replace old')) {
      const replaceRegex = /replace\s+(?:the\s+)?old\s+([a-z\s\d]+)/i;
      const match = lower.match(replaceRegex);
      if (match) {
        equipment.push({
          equipmentName: this.capitalize(match[1].trim()),
          notes: `Replace old ${match[1].trim()}`,
          action: 'REPLACE',
        });
      }
    } else if (lower.includes('drill')) {
      equipment.push({
        equipmentName: 'Professional Nail Drill',
        notes: 'Need to replace the old drill next month',
        action: 'REPLACE',
      });
    }

    // General Expense match fallback (e.g. "rent of 15000")
    if (expenses.length === 0 && lower.includes('rent') && (lower.includes('15000') || lower.includes('15,000'))) {
      expenses.push({
        category: 'RENT',
        amount: 15000,
        notes: 'Booth rental cost',
      });
    }

    return {
      expenses,
      incomes,
      inventory,
      equipment,
      rawText,
    };
  }

  private capitalize(str: string): string {
    return str
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
