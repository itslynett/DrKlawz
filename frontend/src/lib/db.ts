import Dexie, { Table } from 'dexie';

// 1. Define Entity Interfaces for the client database
export interface ClientLocal {
  id: string; // UUID or mock-id
  name: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  email?: string;
  birthday?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string;
  medicalNotes?: string;
  preferredNailShape?: string;
  preferredNailLength?: string;
  favouriteColours: string[];
  favouriteDesigns: string[];
  notes?: string;
  lifetimeSpending: number;
  totalVisits: number;
  lastVisit?: string;
  status: string; // Active, VIP, Inactive
  updatedAt?: string;
  photos?: any[];
}

export interface ServiceLocal {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  materialsUsed?: string;
  estimatedProfit: number;
}

export interface AppointmentLocal {
  id: string;
  clientId: string;
  clientName?: string; // Cache for easy offline rendering
  staffId: string;
  dateTime: string;
  durationMinutes: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  depositPaid: number;
  remainingBalance: number;
  notes?: string;
  services: ServiceLocal[];
}

export interface InventoryItemLocal {
  id: string;
  name: string;
  category: string;
  brand?: string;
  colour?: string;
  supplierId?: string;
  supplierName?: string;
  purchaseDate?: string;
  expiryDate?: string;
  quantityPurchased: number;
  quantityRemaining: number;
  minimumStock: number;
  unitCost: number;
  sellingValue?: number;
  barcode?: string;
  receiptUrl?: string;
}

export interface EquipmentLocal {
  id: string;
  name: string;
  purchaseDate?: string;
  purchaseCost: number;
  warrantyExpiry?: string;
  condition: string;
  maintenanceSchedule?: string;
  nextMaintenanceDate?: string;
  status: 'OPERATIONAL' | 'MAINTENANCE_REQUIRED' | 'IN_REPAIR' | 'REPLACED' | 'DECOMMISSIONED';
  notes?: string;
}

export interface IncomeLocal {
  id: string;
  amount: number;
  tips: number;
  paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_MONEY';
  invoiceNumber?: string;
  paymentDate: string;
  clientId?: string;
  clientName?: string;
  serviceId?: string;
  serviceName?: string;
  notes?: string;
}

export interface ExpenseLocal {
  id: string;
  category: 'RENT' | 'UTILITIES' | 'INTERNET' | 'MARKETING' | 'TRANSPORT' | 'PRODUCTS' | 'EQUIPMENT' | 'REPAIRS' | 'TRAINING' | 'SOFTWARE' | 'SUBSCRIPTIONS' | 'MISCELLANEOUS';
  amount: number;
  notes?: string;
  date: string;
}

export interface DailyNoteLocal {
  id: string;
  date: string;
  rawText: string;
  processed: boolean;
  extractions?: any[];
}

export interface SupplierLocal {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
}

// Outbox item for queueing offline writes
export interface SyncOutboxItem {
  id?: number; // Auto increment ID
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  storeName: string;
  entityId: string;
  data: any; // Raw object payload
  timestamp: number;
}

// 2. Configure Dexie Database Class
export class DrKlawzDatabase extends Dexie {
  clients!: Table<ClientLocal, string>;
  services!: Table<ServiceLocal, string>;
  appointments!: Table<AppointmentLocal, string>;
  inventory!: Table<InventoryItemLocal, string>;
  equipment!: Table<EquipmentLocal, string>;
  income!: Table<IncomeLocal, string>;
  expenses!: Table<ExpenseLocal, string>;
  suppliers!: Table<SupplierLocal, string>;
  dailyNotes!: Table<DailyNoteLocal, string>;
  syncOutbox!: Table<SyncOutboxItem, number>;

  constructor() {
    super('DrKlawzJournalDB');
    this.version(1).stores({
      clients: 'id, name, status, email, phone',
      services: 'id, name, price',
      appointments: 'id, clientId, dateTime, status',
      inventory: 'id, name, category, quantityRemaining, minimumStock',
      equipment: 'id, name, status',
      income: 'id, paymentDate, clientId, serviceId',
      expenses: 'id, date, category',
      suppliers: 'id, name',
      dailyNotes: 'id, date, processed',
      syncOutbox: '++id, action, storeName, entityId, timestamp',
    });
  }

  // Queue a change in the offline outbox
  async queueChange(action: 'CREATE' | 'UPDATE' | 'DELETE', storeName: string, entityId: string, data: any) {
    const outboxItem: SyncOutboxItem = {
      action,
      storeName,
      entityId,
      data,
      timestamp: Date.now(),
    };
    await this.syncOutbox.add(outboxItem);
    console.log(`[Dexie IndexedDB] Queued ${action} in outbox for ${storeName} (ID: ${entityId})`);
  }
}

export const db = new DrKlawzDatabase();

export async function clearAllJournalData() {
  console.log('[Dexie IndexedDB] Wiping all local journal tables...');
  await db.clients.clear();
  await db.services.clear();
  await db.appointments.clear();
  await db.inventory.clear();
  await db.equipment.clear();
  await db.income.clear();
  await db.expenses.clear();
  await db.suppliers.clear();
  await db.dailyNotes.clear();
  await db.syncOutbox.clear();
  console.log('[Dexie IndexedDB] All tables cleared successfully.');
}

export async function seedStressTestData() {
  console.log('[Dexie IndexedDB] Seeding stress-test data for Dr. Klawz...');

  // 1. Clear existing local tables
  await db.clients.clear();
  await db.services.clear();
  await db.appointments.clear();
  await db.inventory.clear();
  await db.equipment.clear();
  await db.income.clear();
  await db.expenses.clear();
  await db.suppliers.clear();
  await db.dailyNotes.clear();

  // 2. Services
  const servicesData: ServiceLocal[] = [
    { id: 'ser-1', name: 'Gel Polish', price: 1500, durationMinutes: 45, materialsUsed: 'Gel base, gel colors, top coat', estimatedProfit: 1200 },
    { id: 'ser-2', name: 'Gel X Extension', price: 3500, durationMinutes: 90, materialsUsed: 'Gel X tips, soft gel glue, colors, top coat', estimatedProfit: 2800 },
    { id: 'ser-3', name: 'Builder Gel Overlay', price: 2500, durationMinutes: 60, materialsUsed: 'Builder gel structure, color, top coat', estimatedProfit: 1900 },
    { id: 'ser-4', name: 'Acrylic Full Set', price: 4000, durationMinutes: 120, materialsUsed: 'Acrylic liquid, monomer, tips, files', estimatedProfit: 3000 },
    { id: 'ser-5', name: 'French Tips Add-on', price: 1000, durationMinutes: 30, materialsUsed: 'Detailing paint', estimatedProfit: 900 },
    { id: 'ser-6', name: 'Custom Nail Art (Full Set)', price: 1500, durationMinutes: 45, materialsUsed: 'Chromes, gems, pigments', estimatedProfit: 1200 },
    { id: 'ser-7', name: 'Gel Refill', price: 2000, durationMinutes: 60, materialsUsed: 'Structure gels', estimatedProfit: 1600 },
    { id: 'ser-8', name: 'Signature Manicure', price: 1500, durationMinutes: 45, materialsUsed: 'Scrubs, oils, lotions', estimatedProfit: 1200 },
    { id: 'ser-9', name: 'Signature Pedicure', price: 2000, durationMinutes: 60, materialsUsed: 'Pedicure salts, scrubs, files', estimatedProfit: 1650 },
    { id: 'ser-10', name: 'Nail Repair (Single)', price: 500, durationMinutes: 20, materialsUsed: 'Silk wrap, tips, glue', estimatedProfit: 450 }
  ];
  await db.services.bulkAdd(servicesData);

  // 3. Suppliers
  const suppliersData: SupplierLocal[] = [
    { id: 'sup-1', name: 'Beauty World Nairobi', contactPerson: 'Alice Kamau', phone: '+254712345678', email: 'sales@beautyworld.co.ke' },
    { id: 'sup-2', name: 'Nail Supply Kenya', contactPerson: 'David Mwangi', phone: '+254722222222', email: 'info@nailsupply.co.ke' },
    { id: 'sup-3', name: 'Glamour Beauty Hub', contactPerson: 'Zainab Patel', phone: '+254733444555', email: 'orders@glamourhub.co.ke' }
  ];
  await db.suppliers.bulkAdd(suppliersData);

  // 4. Inventory Items
  const inventoryData: InventoryItemLocal[] = [
    { id: 'inv-1', name: 'OPI Base Coat 15ml', category: 'Consumables', brand: 'OPI', supplierId: 'sup-1', supplierName: 'Beauty World Nairobi', quantityPurchased: 12, quantityRemaining: 10, minimumStock: 2, unitCost: 1200, barcode: 'OPI-BASE-01' },
    { id: 'inv-2', name: 'OPI Top Coat Gloss 15ml', category: 'Consumables', brand: 'OPI', supplierId: 'sup-1', supplierName: 'Beauty World Nairobi', quantityPurchased: 15, quantityRemaining: 12, minimumStock: 3, unitCost: 1200, barcode: 'OPI-TOP-01' },
    { id: 'inv-3', name: 'Apres Soft Gel Glue', category: 'Consumables', brand: 'Apres', supplierId: 'sup-2', supplierName: 'Nail Supply Kenya', quantityPurchased: 8, quantityRemaining: 1, minimumStock: 2, unitCost: 2500, barcode: 'APRES-GLUE' },
    { id: 'inv-4', name: 'Gel Polish - Nude #04', category: 'Consumables', brand: 'OPI', supplierId: 'sup-1', supplierName: 'Beauty World Nairobi', quantityPurchased: 6, quantityRemaining: 4, minimumStock: 2, unitCost: 800, barcode: 'OPI-GEL-NUDE' },
    { id: 'inv-5', name: 'Gel Polish - Crimson Satin', category: 'Consumables', brand: 'OPI', supplierId: 'sup-1', supplierName: 'Beauty World Nairobi', quantityPurchased: 5, quantityRemaining: 3, minimumStock: 2, unitCost: 800, barcode: 'OPI-GEL-RED' },
    { id: 'inv-6', name: 'Apres Gel-X Almond Medium Tips', category: 'Consumables', brand: 'Apres', supplierId: 'sup-2', supplierName: 'Nail Supply Kenya', quantityPurchased: 3, quantityRemaining: 1, minimumStock: 2, unitCost: 1500, barcode: 'APRES-ALM-MED' },
    { id: 'inv-7', name: 'Born Pretty Silver Chrome', category: 'Consumables', brand: 'Born Pretty', supplierId: 'sup-3', supplierName: 'Glamour Beauty Hub', quantityPurchased: 4, quantityRemaining: 2, minimumStock: 1, unitCost: 600, barcode: 'BP-CHROME-SIL' },
    { id: 'inv-8', name: 'Isopropyl Alcohol 99% (5L)', category: 'Sanitary', brand: 'Local', supplierId: 'sup-1', supplierName: 'Beauty World Nairobi', quantityPurchased: 2, quantityRemaining: 1, minimumStock: 1, unitCost: 1500, barcode: 'ALC-99-5L' },
    { id: 'inv-9', name: 'Nail Files 100/180 (Pack of 50)', category: 'Tools', brand: 'Generic', supplierId: 'sup-2', supplierName: 'Nail Supply Kenya', quantityPurchased: 2, quantityRemaining: 1, minimumStock: 1, unitCost: 1200, barcode: 'FILE-100-50' },
    { id: 'inv-10', name: 'Nail Buffers Block (Pack of 20)', category: 'Tools', brand: 'Generic', supplierId: 'sup-2', supplierName: 'Nail Supply Kenya', quantityPurchased: 3, quantityRemaining: 2, minimumStock: 1, unitCost: 800, barcode: 'BUFF-BLOCK-20' }
  ];
  await db.inventory.bulkAdd(inventoryData);

  // 5. Equipment
  const equipmentData: EquipmentLocal[] = [
    { id: 'eq-1', name: 'Kupa ManiPro Passport Drill', purchaseCost: 35000, condition: 'Excellent', maintenanceSchedule: 'Monthly cleaning of handpiece', status: 'OPERATIONAL' },
    { id: 'eq-2', name: 'Professional UV LED Nail Lamp 48W', purchaseCost: 4500, condition: 'Excellent', maintenanceSchedule: 'Clean sensor bulbs weekly', status: 'OPERATIONAL' },
    { id: 'eq-3', name: 'Glass Top Manicure Desk', purchaseCost: 18000, condition: 'Excellent', maintenanceSchedule: 'Wipe down with alcohol daily', status: 'OPERATIONAL' },
    { id: 'eq-4', name: 'Ergonomic Technician Chair', purchaseCost: 8500, condition: 'Good', maintenanceSchedule: 'Inspect hydraulic pump', status: 'OPERATIONAL' },
    { id: 'eq-5', name: 'Shemax Tabletop Dust Collector', purchaseCost: 12000, condition: 'Good', maintenanceSchedule: 'Empty filter bag every 15 sessions', status: 'MAINTENANCE_REQUIRED' },
    { id: 'eq-6', name: 'Neewer Ring Light 18"', purchaseCost: 6500, condition: 'Excellent', maintenanceSchedule: 'Wipe lenses monthly', status: 'OPERATIONAL' },
    { id: 'eq-7', name: 'Autoclave Heat Sterilizer', purchaseCost: 22000, condition: 'Excellent', maintenanceSchedule: 'Calibrate chamber temperature quarterly', status: 'OPERATIONAL' }
  ];
  await db.equipment.bulkAdd(equipmentData);

  // 6. Clients (40 Realistic Nail Tech Clients)
  const clientNames = [
    'Sarah Jenkins', 'Elena Rostova', 'Lisa Wanjiku', 'Amanda Mwangi', 'Wambui Kamau', 'Amina Yusuf',
    'Faith Mutua', 'Grace Nekesa', 'Mercy Chebet', 'Rachel Achieng', 'Sharon Nduta', 'Patricia Mumbua',
    'Caroline Njeri', 'Vera Sidika', 'Brenda Wairimu', 'Kate Karanja', 'Joy Kendi', 'Anita Nderu',
    'Sarah Hassan', 'Lupita Nyongo', 'Catherine Kamau', 'Avril Nyambura', 'Victoria Rubadiri', 'Lillian Muli',
    'Shix Kapienga', 'Adelle Onyango', 'Sylvia Mulinge', 'Rita Dominic', 'Genevieve Nnaji', 'Tiwa Savage'
  ];
  const shapes = ['Almond', 'Coffin', 'Square', 'Stiletto', 'Oval', 'Round'];
  const lengths = ['Short', 'Medium', 'Long', 'Extra Long'];
  const colors = ['Crimson Satin', 'Nude Pink', 'Emerald Green', 'Chrome Silver', 'Glitter Gold', 'Soft Lavender'];

  const clientsData: ClientLocal[] = clientNames.map((name, idx) => {
    const isVip = idx % 4 === 0;
    const phone = `+2547${Math.floor(10000000 + Math.random() * 90000000)}`;
    return {
      id: `cli-${idx + 1}`,
      name,
      phone,
      whatsapp: phone,
      instagram: `@${name.toLowerCase().replace(/\s/g, '_')}`,
      email: `${name.toLowerCase().replace(/\s/g, '')}@gmail.com`,
      birthday: new Date(1992 + (idx % 10), (idx % 12), (idx % 27) + 1).toISOString(),
      address: 'Nairobi County',
      allergies: idx % 8 === 0 ? 'Latex sensitivity' : 'None',
      medicalNotes: idx % 10 === 0 ? 'Sensitive cuticles' : 'None',
      preferredNailShape: shapes[idx % shapes.length],
      preferredNailLength: lengths[idx % lengths.length],
      favouriteColours: [colors[idx % colors.length], colors[(idx + 1) % colors.length]],
      favouriteDesigns: idx % 2 === 0 ? ['French Tips', 'Chrome Finish'] : ['Minimalist Lines'],
      notes: idx % 3 === 0 ? 'Prefers almond shape French tips.' : '',
      lifetimeSpending: (idx + 1) * 3500,
      totalVisits: (idx % 8) + 1,
      lastVisit: new Date(Date.now() - (idx * 2 * 24 * 60 * 60 * 1000)).toISOString(),
      status: isVip ? 'VIP' : 'Active',
      photos: []
    };
  });
  await db.clients.bulkAdd(clientsData);

  // 7. Appointments & Financial Ledgers
  const today = new Date();
  const appointmentsData: AppointmentLocal[] = [];
  const incomeData: IncomeLocal[] = [];
  const expensesData: ExpenseLocal[] = [];

  let appIdx = 0;
  for (let d = 45; d >= 0; d--) {
    const targetDate = new Date(today.getTime() - d * 24 * 60 * 60 * 1000);
    if (targetDate.getDay() === 0) continue; // Skip Sunday

    const sessionsCount = (d % 3) + 1;
    for (let s = 0; s < sessionsCount; s++) {
      appIdx++;
      const client = clientsData[appIdx % clientsData.length];
      const service = servicesData[appIdx % servicesData.length];
      const hour = 9 + s * 3;
      const dateTimeStr = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), hour, 0).toISOString();
      const isPast = d > 0;
      const status = isPast ? 'COMPLETED' : (d === 0 ? 'CONFIRMED' : 'PENDING');

      const appItem: AppointmentLocal = {
        id: `app-${appIdx}`,
        clientId: client.id,
        clientName: client.name,
        staffId: 'staff-1',
        dateTime: dateTimeStr,
        durationMinutes: service.durationMinutes,
        status,
        depositPaid: 500,
        remainingBalance: Math.max(0, service.price - 500),
        notes: `Nail session: ${service.name}`,
        services: [service],
      };
      appointmentsData.push(appItem);

      if (status === 'COMPLETED') {
        incomeData.push({
          id: `inc-${appIdx}`,
          amount: service.price,
          tips: appIdx % 2 === 0 ? 500 : 0,
          paymentMethod: appIdx % 3 === 0 ? 'MOBILE_MONEY' : 'CASH',
          invoiceNumber: `INV-2026-${1000 + appIdx}`,
          paymentDate: dateTimeStr,
          clientId: client.id,
          clientName: client.name,
          serviceId: service.id,
          serviceName: service.name,
          notes: `Paid for ${service.name}`,
        });
      }
    }
  }

  // Monthly Expenses
  const expCategories = ['RENT', 'PRODUCTS', 'INTERNET', 'MARKETING', 'TRANSPORT'] as const;
  const expAmounts = [15000, 4500, 3000, 5000, 1500];
  expCategories.forEach((cat, idx) => {
    expensesData.push({
      id: `exp-${idx + 1}`,
      category: cat,
      amount: expAmounts[idx],
      notes: `Monthly ${cat.toLowerCase()} expenditure`,
      date: new Date(today.getFullYear(), today.getMonth(), 1 + idx).toISOString(),
    });
  });

  await db.appointments.bulkAdd(appointmentsData);
  await db.income.bulkAdd(incomeData);
  await db.expenses.bulkAdd(expensesData);

  // 8. Daily AI Notes
  const dailyNotesData: DailyNoteLocal[] = [
    {
      id: 'note-1',
      date: new Date().toISOString(),
      rawText: "Sarah came for Gel X and paid KSh 3,500. Bought 4 nude gel polishes from Beauty World for KSh 3,200.",
      processed: true,
      extractions: [
        { id: 'ext-1', entityType: 'INCOME', matchedText: 'Sarah Jenkins - Gel X: 3500', data: JSON.stringify({ clientName: 'Sarah Jenkins', serviceName: 'Gel X Extension', amount: 3500 }), confirmed: true },
        { id: 'ext-2', entityType: 'EXPENSE', matchedText: 'PRODUCTS: 3200', data: JSON.stringify({ category: 'PRODUCTS', amount: 3200 }), confirmed: true },
        { id: 'ext-3', entityType: 'INVENTORY', matchedText: 'Nude Gel Polish (4 units)', data: JSON.stringify({ productName: 'Nude Gel Polish', category: 'Consumables', supplierName: 'Beauty World Nairobi', quantityPurchased: 4, unitCost: 800 }), confirmed: false }
      ]
    },
    {
      id: 'note-2',
      date: new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      rawText: "Elena Rostova came for Builder Gel Overlay and paid KSh 2,500 via M-Pesa. Ordered replacement UV LED lamp.",
      processed: true,
      extractions: [
        { id: 'ext-4', entityType: 'INCOME', matchedText: 'Elena Rostova - Builder Gel: 2500', data: JSON.stringify({ clientName: 'Elena Rostova', serviceName: 'Builder Gel Overlay', amount: 2500 }), confirmed: true },
        { id: 'ext-5', entityType: 'EQUIPMENT_MAINTENANCE', matchedText: 'UV LED Nail Lamp (ORDERED)', data: JSON.stringify({ equipmentName: 'Professional UV LED Nail Lamp 48W', action: 'ORDERED' }), confirmed: true }
      ]
    }
  ];
  await db.dailyNotes.bulkAdd(dailyNotesData);

  console.log('[Dexie IndexedDB] Seed & Stress-Test Data successfully populated!');
}

