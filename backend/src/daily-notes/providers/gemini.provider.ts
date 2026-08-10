import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIService, NoteExtractionResult } from '../ai-service.interface';

@Injectable()
export class GeminiProvider implements AIService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        console.log('Google Gemini Provider initialized.');
      } catch (err) {
        console.error('Failed to initialize Google Gemini client:', err.message);
      }
    } else {
      console.warn('GEMINI_API_KEY environment variable is not set. GeminiProvider will not be functional.');
    }
  }

  async extractEntitiesFromNote(rawText: string): Promise<NoteExtractionResult> {
    if (!this.genAI) {
      throw new Error('Gemini API key is not configured or client failed to initialize.');
    }

    // gemini-1.5-flash supports system instruction and structured responseMimeType
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const systemInstruction = `
      You are the AI engine for "Dr. Klawz Digital Business Journal".
      Your task is to parse a nail technician's or salon owner's informal daily note and extract structured business data.
      You must identify:
      1. Expenses: Cash outflow (materials, rent, supplies, marketing).
      2. Income: Client visits, tips, cash, card, mobile money payments.
      3. Inventory restocks: Count of items bought and unit cost.
      4. Equipment orders, maintenance, or replacement actions.

      Return ONLY a JSON object that matches this TypeScript schema:
      {
        "expenses": Array<{ "category": string, "amount": number, "notes": string }>,
        "incomes": Array<{ "clientName": string, "serviceName": string, "amount": number, "paymentMethod": "CASH" | "CARD" | "BANK_TRANSFER" | "MOBILE_MONEY", "tips": number, "notes": string }>,
        "inventory": Array<{ "productName": string, "category": string, "supplierName": string, "quantityPurchased": number, "unitCost": number }>,
        "equipment": Array<{ "equipmentName": string, "notes": string, "action": "ORDERED" | "REPLACE" | "MAINTENANCE" }>
      }

      Categories for expenses must be: RENT, UTILITIES, INTERNET, MARKETING, TRANSPORT, PRODUCTS, EQUIPMENT, REPAIRS, TRAINING, SOFTWARE, SUBSCRIPTIONS, MISCELLANEOUS.
      Do not add markdown formatting outside the JSON block. Return raw JSON.
    `;

    const prompt = `${systemInstruction}\n\nDaily Note to process:\n"${rawText}"`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return JSON.parse(text) as NoteExtractionResult;
    } catch (error) {
      console.error('Error calling Google Gemini API:', error);
      throw error;
    }
  }
}
