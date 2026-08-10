import { PrismaClient, Role, AppointmentStatus, EquipmentStatus, PaymentMethod, ExpenseCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with live historical data for Dr. Klawz...');

  // 1. Clean existing records
  await prisma.dailyNoteExtraction.deleteMany({});
  await prisma.dailyNote.deleteMany({});
  await prisma.income.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.inventoryHistory.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.equipmentRepair.deleteMany({});
  await prisma.equipment.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.clientPhoto.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.workSchedule.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Staff & Admin
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash('password123', saltRounds);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@drklawz.com',
      passwordHash,
      name: 'Dr. Klawz (Owner)',
      role: Role.ADMIN,
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: 'jane@drklawz.com',
      passwordHash,
      name: 'Jane Doe (Nail Tech)',
      role: Role.STAFF,
    },
  });

  console.log('Created Staff accounts:', [admin.email, staff.email]);

  // 3. Create Work Schedules
  const days = [1, 2, 3, 4, 5, 6]; // Mon - Sat
  for (const day of days) {
    await prisma.workSchedule.create({
      data: {
        staffId: admin.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '18:00',
        isWorking: true,
      },
    });
    // Jane works Mon-Fri
    if (day <= 5) {
      await prisma.workSchedule.create({
        data: {
          staffId: staff.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          isWorking: true,
        },
      });
    }
  }
  // Sunday Offs
  await prisma.workSchedule.create({
    data: { staffId: admin.id, dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isWorking: false },
  });
  await prisma.workSchedule.create({
    data: { staffId: staff.id, dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isWorking: false },
  });
  await prisma.workSchedule.create({
    data: { staffId: staff.id, dayOfWeek: 6, startTime: '00:00', endTime: '00:00', isWorking: false },
  });

  console.log('Created work schedules.');

  // 4. Create Services
  const servicesData = [
    { name: 'Gel Polish', price: 1500, duration: 45, materials: 'Gel base, gel colors, top coat', profit: 1200 },
    { name: 'Gel X Extension', price: 3500, duration: 90, materials: 'Gel X tips, soft gel glue, colors, top coat', profit: 2800 },
    { name: 'Builder Gel Overlay', price: 2500, duration: 60, materials: 'Builder gel structure, color, top coat', profit: 1900 },
    { name: 'Acrylic Full Set', price: 4000, duration: 120, materials: 'Acrylic liquid, monomer, tips, files', profit: 3000 },
    { name: 'French Tips Add-on', price: 1000, duration: 30, materials: 'Detailing paint', profit: 900 },
    { name: 'Custom Nail Art (Full Set)', price: 1500, duration: 45, materials: 'Chromes, gems, pigments', profit: 1200 },
    { name: 'Gel Refill', price: 2000, duration: 60, materials: 'Structure gels', profit: 1600 },
    { name: 'Signature Manicure', price: 1500, duration: 45, materials: 'Scrubs, oils, lotions', profit: 1200 },
    { name: 'Signature Pedicure', price: 2000, duration: 60, materials: 'Pedicure salts, scrubs, files', profit: 1650 },
    { name: 'Nail Repair (Single)', price: 500, duration: 20, materials: 'Silk wrap, tips, glue', profit: 450 }
  ];

  const services: any[] = [];
  for (const s of servicesData) {
    const created = await prisma.service.create({
      data: {
        name: s.name,
        price: s.price,
        durationMinutes: s.duration,
        materialsUsed: s.materials,
        estimatedProfit: s.profit,
      },
    });
    services.push(created);
  }
  console.log('Created treatments catalogue.');

  // 5. Create Suppliers
  const suppliersData = [
    { name: 'Beauty World Nairobi', contact: 'Alice Kamau', phone: '+254712345678', email: 'sales@beautyworld.co.ke' },
    { name: 'Nail Supply Kenya', contact: 'David Mwangi', phone: '+254722222222', email: 'info@nailsupply.co.ke' },
    { name: 'Glamour Beauty Hub', contact: 'Zainab Patel', phone: '+254733444555', email: 'orders@glamourhub.co.ke' }
  ];

  const suppliers: any[] = [];
  for (const sup of suppliersData) {
    const created = await prisma.supplier.create({
      data: {
        name: sup.name,
        contactPerson: sup.contact,
        phone: sup.phone,
        email: sup.email,
        notes: 'Main distributor for premium acrylic and gel stock.',
      },
    });
    suppliers.push(created);
  }
  console.log('Created supplier listings.');

  // 6. Create Products (Inventory)
  const productsData = [
    { name: 'OPI Base Coat 15ml', category: 'Consumables', brand: 'OPI', cost: 1200, qty: 12, min: 2, barcode: 'OPI-BASE-01' },
    { name: 'OPI Top Coat Gloss 15ml', category: 'Consumables', brand: 'OPI', cost: 1200, qty: 15, min: 3, barcode: 'OPI-TOP-01' },
    { name: 'Apres Soft Gel Glue', category: 'Consumables', brand: 'Apres', cost: 2500, qty: 8, min: 2, barcode: 'APRES-GLUE' },
    { name: 'Gel Polish - Nude #04', category: 'Consumables', brand: 'OPI', cost: 800, qty: 6, min: 2, barcode: 'OPI-GEL-NUDE' },
    { name: 'Gel Polish - Crimson Satin', category: 'Consumables', brand: 'OPI', cost: 800, qty: 5, min: 2, barcode: 'OPI-GEL-RED' },
    { name: 'Apres Gel-X Almond Medium Tips', category: 'Consumables', brand: 'Apres', cost: 1500, qty: 3, min: 1, barcode: 'APRES-ALM-MED' },
    { name: 'Born Pretty Silver Chrome', category: 'Consumables', brand: 'Born Pretty', cost: 600, qty: 4, min: 1, barcode: 'BP-CHROME-SIL' },
    { name: 'Isopropyl Alcohol 99% (5L)', category: 'Sanitary', brand: 'Local', cost: 1500, qty: 2, min: 1, barcode: 'ALC-99-5L' },
    { name: 'Nail Files 100/180 (Pack of 50)', category: 'Tools', brand: 'Generic', cost: 1200, qty: 2, min: 1, barcode: 'FILE-100-50' },
    { name: 'Nail Buffers Block (Pack of 20)', category: 'Tools', brand: 'Generic', cost: 800, qty: 3, min: 1, barcode: 'BUFF-BLOCK-20' },
    { name: 'Acetone Pure (5L)', category: 'Sanitary', brand: 'Local', cost: 1800, qty: 2, min: 1, barcode: 'ACETONE-5L' },
    { name: 'Nitrile Gloves Box of 100', category: 'Sanitary', brand: 'Bodyguard', cost: 1000, qty: 5, min: 1, barcode: 'GLOVES-NIT' },
    { name: 'Lavender Cuticle Oil 30ml', category: 'Consumables', brand: 'OPI', cost: 500, qty: 10, min: 2, barcode: 'OPI-CUT-OIL' }
  ];

  for (const prod of productsData) {
    await prisma.inventoryItem.create({
      data: {
        name: prod.name,
        category: prod.category,
        brand: prod.brand,
        supplierId: suppliers[0].id,
        quantityPurchased: prod.qty,
        quantityRemaining: prod.qty - 2, // simulated usage
        minimumStock: prod.min,
        unitCost: prod.cost,
        barcode: prod.barcode,
      },
    });
  }
  console.log('Created inventory logs.');

  // 7. Create Equipment
  const equipmentData = [
    { name: 'Kupa ManiPro Passport Drill', cost: 35000, schedule: 'Monthly cleaning of handpiece', condition: 'Excellent', status: EquipmentStatus.OPERATIONAL },
    { name: 'Professional UV LED Nail Lamp 48W', cost: 4500, schedule: 'Clean sensor bulbs weekly', condition: 'Excellent', status: EquipmentStatus.OPERATIONAL },
    { name: 'Glass Top Salon Manicure Desk', cost: 18000, schedule: 'Wipe down with alcohol daily', condition: 'Excellent', status: EquipmentStatus.OPERATIONAL },
    { name: 'Ergonomic Technican Chair', cost: 8500, schedule: 'None', condition: 'Good', status: EquipmentStatus.OPERATIONAL },
    { name: 'Shemax Tabletop Dust Collector', cost: 12000, schedule: 'Empty filter bag every 15 sessions', condition: 'Good', status: EquipmentStatus.MAINTENANCE_REQUIRED },
    { name: 'Neewer Ring Light 18"', cost: 6500, schedule: 'Wipe lenses monthly', condition: 'Excellent', status: EquipmentStatus.OPERATIONAL },
    { name: 'Autoclave Heat Sterilizer', cost: 22000, schedule: 'Calibrate chamber temperature quarterly', condition: 'Excellent', status: EquipmentStatus.OPERATIONAL }
  ];

  for (const eq of equipmentData) {
    await prisma.equipment.create({
      data: {
        name: eq.name,
        purchaseCost: eq.cost,
        maintenanceSchedule: eq.schedule,
        condition: eq.condition,
        status: eq.status,
      },
    });
  }
  console.log('Created equipment register.');

  // 8. Generate 50+ Clients
  const clientNames = [
    'Sarah Jenkins', 'Elena Rostova', 'Lisa Wanjiku', 'Amanda Mwangi', 'Wambui Kamau', 'Amina Yusuf',
    'Faith Mutua', 'Grace Nekesa', 'Mercy Chebet', 'Rachel Achieng', 'Sharon Nduta', 'Patricia Mumbua',
    'Caroline Njeri', 'Vera Sidika', 'Brenda Wairimu', 'Kate Karanja', 'Joy Kendi', 'Anita Nderu',
    'Sarah Hassan', 'Lupita Nyongo', 'Catherine Kamau', 'Avril Nyambura', 'Victoria Rubadiri', 'Lillian Muli',
    'Shix Kapienga', 'Adelle Onyango', 'Sylvia Mulinge', 'Rita Dominic', 'Genevieve Nnaji', 'Tiwa Savage',
    'Yemi Alade', 'Bonang Matheba', 'Nomzamo Mbatha', 'Pearl Thusi', 'Boity Thulo', 'Jessica Nkosi',
    'Khanyi Mbau', 'Minnie Dlamini', 'Lerato Kganyago', 'Kelly Khumalo', 'Zodwa Wabantu', 'Nandi Madida',
    'Enhle Mbali', 'Terry Pheto', 'Thuso Mbedu', 'Zola Nombona', 'Sphelele Dunywa', 'Nokuthula Ledwaba'
  ];

  const shapes = ['Almond', 'Coffin', 'Square', 'Stiletto', 'Oval', 'Round'];
  const lengths = ['Short', 'Medium', 'Long', 'Extra Long'];
  const colors = ['Crimson Satin', 'Nude Pink', 'Emerald Green', 'Chrome Silver', 'Glitter Gold', 'Soft Lavender'];

  const clients: any[] = [];
  for (let i = 0; i < clientNames.length; i++) {
    const isVip = i % 5 === 0;
    const name = clientNames[i];
    const email = `${name.toLowerCase().replace(/\s/g, '')}@gmail.com`;
    const phone = `+2547${Math.floor(10000000 + Math.random() * 90000000)}`;
    
    const client = await prisma.client.create({
      data: {
        name,
        phone,
        whatsapp: phone,
        instagram: `@${name.toLowerCase().replace(/\s/g, '_')}`,
        email,
        birthday: new Date(1990 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        address: 'Nairobi County',
        allergies: i % 10 === 0 ? 'Latex sensitivity' : 'None',
        medicalNotes: i % 12 === 0 ? 'Sensitive cuticles' : 'None',
        preferredNailShape: shapes[i % shapes.length],
        preferredNailLength: lengths[i % lengths.length],
        favouriteColours: [colors[i % colors.length], colors[(i + 1) % colors.length]],
        favouriteDesigns: i % 3 === 0 ? ['French Tips', 'Chrome Finish'] : ['Minimalist Lines'],
        notes: i % 4 === 0 ? 'Enjoys warm herbal tea and quiet session.' : '',
        status: isVip ? 'VIP' : 'Active',
      },
    });
    clients.push(client);
  }
  console.log(`Created ${clients.length} client profiles.`);

  // 9. Generate 60 Days of Realistic Appointments & Income
  const today = new Date();
  let appCount = 0;
  let revenueTotal = 0;

  for (let d = 59; d >= 0; d--) {
    const targetDate = new Date(today.getTime() - d * 24 * 60 * 60 * 1000);
    // Skip Sunday bookings
    if (targetDate.getDay() === 0) continue;

    // Number of bookings today (1 to 3)
    const bookingsToday = Math.floor(Math.random() * 3) + 1;
    
    for (let b = 0; b < bookingsToday; b++) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      const tech = Math.random() > 0.35 ? admin : staff; // Dr. Klawz works more sessions
      const service = services[Math.floor(Math.random() * services.length)];
      const extraService = Math.random() > 0.7 ? services[4] : null; // occasional french tips add-on

      const hour = 9 + b * 3; // 9 AM, 12 PM, 3 PM
      const dateTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), hour, 0, 0);

      const isPast = d > 0;
      let status: AppointmentStatus = AppointmentStatus.COMPLETED;
      if (d === 0) {
        status = AppointmentStatus.CONFIRMED; // Today's appointments are confirmed
      } else if (d < 0) {
        status = AppointmentStatus.PENDING; // Future bookings
      }

      const totalCost = Number(service.price) + (extraService ? Number(extraService.price) : 0);
      const app = await prisma.appointment.create({
        data: {
          clientId: client.id,
          staffId: tech.id,
          dateTime,
          durationMinutes: service.durationMinutes + (extraService ? extraService.durationMinutes : 0),
          status,
          depositPaid: 0.00,
          remainingBalance: totalCost,
          notes: 'Standard scheduled visit.',
          preferredLength: client.preferredNailLength,
          preferredShape: client.preferredNailShape,
          preferredColours: client.favouriteColours,
          termsAgreed: true,
          services: {
            connect: extraService 
              ? [{ id: service.id }, { id: extraService.id }]
              : [{ id: service.id }],
          },
        },
      });

      appCount++;

      // 10. Generate corresponding Income ledgers for COMPLETED visits
      if (status === AppointmentStatus.COMPLETED) {
        const tips = Math.random() > 0.6 ? 500 : 0;
        const discount = Math.random() > 0.9 ? 200 : 0;
        const netAmount = totalCost - discount;

        await prisma.income.create({
          data: {
            amount: netAmount,
            tips,
            discount,
            paymentMethod: Math.random() > 0.2 ? PaymentMethod.MOBILE_MONEY : PaymentMethod.CASH,
            invoiceNumber: `INV-2026-${1000 + appCount}`,
            paymentDate: dateTime,
            clientId: client.id,
            appointmentId: app.id,
            serviceId: service.id,
            notes: `Paid via M-Pesa. Client: ${client.name}`,
          },
        });

        // Update client lifetime variables
        await prisma.client.update({
          where: { id: client.id },
          data: {
            lifetimeSpending: { increment: netAmount + tips },
            totalVisits: { increment: 1 },
            lastVisit: dateTime,
          },
        });

        revenueTotal += netAmount;
      }
    }
  }

  console.log(`Created ${appCount} appointments with live income transactions (Total sales: KSh ${revenueTotal.toLocaleString()}).`);

  // 11. Create Realistic Business Expenses
  const categories = [
    { cat: ExpenseCategory.RENT, amount: 15000, notes: 'Salon booth monthly rental' },
    { cat: ExpenseCategory.INTERNET, amount: 3000, notes: 'Unlimited Fibre Internet line' },
    { cat: ExpenseCategory.MARKETING, amount: 5000, notes: 'Instagram ads budget' },
    { cat: ExpenseCategory.PRODUCTS, amount: 8000, notes: 'Restock base coats and acetone' },
    { cat: ExpenseCategory.TRANSPORT, amount: 1500, notes: 'Commute and product pickup' }
  ];

  // 2 months history of monthly items (June and July)
  const expenseMonths = [5, 6]; // June, July
  for (const m of expenseMonths) {
    for (const exp of categories) {
      const expDate = new Date(today.getFullYear(), m, 1 + Math.floor(Math.random() * 5));
      await prisma.expense.create({
        data: {
          category: exp.cat,
          amount: exp.amount,
          notes: exp.notes,
          date: expDate,
        },
      });
    }
  }

  console.log('Created historical business expenses ledgers.');
  console.log('Dr. Klawz database seeding executed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
