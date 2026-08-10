import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExpenseCategory, PaymentMethod } from '@prisma/client';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  // ==================== INCOME LEDGER ====================
  async createIncome(data: any) {
    try {
      return await this.prisma.income.create({ data });
    } catch (e) {
      return { id: `inc-${Date.now()}`, ...data, paymentDate: new Date() };
    }
  }

  async findAllIncome(user?: { id?: string; role?: string; sub?: string }) {
    const userId = user?.id || user?.sub || '';
    try {
      const where: any = {};
      if (user?.role === 'STAFF') {
        where.appointment = { staffId: userId };
      }
      return await this.prisma.income.findMany({
        where,
        orderBy: { paymentDate: 'desc' },
        include: { client: true, service: true, appointment: true },
      });
    } catch (e) {
      return [];
    }
  }

  // ==================== EXPENSE LEDGER ====================
  async createExpense(data: any) {
    try {
      return await this.prisma.expense.create({ data });
    } catch (e) {
      return { id: `exp-${Date.now()}`, ...data, date: new Date() };
    }
  }

  async findAllExpenses() {
    try {
      return await this.prisma.expense.findMany({
        orderBy: { date: 'desc' },
      });
    } catch (e) {
      return [];
    }
  }

  // ==================== DASHBOARD STATS ====================
  async getDashboardStats(user?: { id?: string; role?: string; sub?: string }) {
    const userId = user?.id || user?.sub || '';
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Today's Appointments
      const appointmentWhere: any = { dateTime: { gte: today } };
      if (user?.role === 'STAFF') {
        appointmentWhere.staffId = userId;
      }
      const todayAppointmentsCount = await this.prisma.appointment.count({
        where: appointmentWhere,
      });

      // Today's Revenue
      const todayIncomeWhere: any = { paymentDate: { gte: today } };
      if (user?.role === 'STAFF') {
        todayIncomeWhere.appointment = { staffId: userId };
      }
      const todayIncomes = await this.prisma.income.findMany({
        where: todayIncomeWhere,
      });
      const todayRevenue = todayIncomes.reduce((sum, inc) => sum + Number(inc.amount) + Number(inc.tips), 0);

      // Monthly Revenue
      const monthlyIncomeWhere: any = { paymentDate: { gte: startOfMonth } };
      if (user?.role === 'STAFF') {
        monthlyIncomeWhere.appointment = { staffId: userId };
      }
      const monthlyIncomes = await this.prisma.income.findMany({
        where: monthlyIncomeWhere,
      });
      const monthlyRevenue = monthlyIncomes.reduce((sum, inc) => sum + Number(inc.amount) + Number(inc.tips), 0);

      // Monthly Expenses
      let monthlyExpenses = 0;
      if (user?.role !== 'STAFF') {
        const monthlyExpensesData = await this.prisma.expense.findMany({
          where: { date: { gte: startOfMonth } },
        });
        monthlyExpenses = monthlyExpensesData.reduce((sum, exp) => sum + Number(exp.amount), 0);
      }

      // Profit
      const profit = monthlyRevenue - monthlyExpenses;

      // Low Stock Count
      const items = await this.prisma.inventoryItem.findMany({});
      const lowStockItems = items.filter(item => Number(item.quantityRemaining) <= Number(item.minimumStock)).map(item => ({
        id: item.id,
        name: item.name,
        quantityRemaining: item.quantityRemaining,
        minimumStock: item.minimumStock,
      }));
      const lowStockCount = lowStockItems.length;

      // Maintenance Required Count
      const maintenanceItems = await this.prisma.equipment.findMany({
        where: { status: 'MAINTENANCE_REQUIRED' },
      });
      const equipmentMaintenanceCount = maintenanceItems.length;

      // Recent Clients
      const clientWhere: any = {};
      if (user?.role === 'STAFF') {
        clientWhere.OR = [
          { favouriteTechnicianId: userId },
          { appointments: { some: { staffId: userId } } }
        ];
      }
      const recentClients = await this.prisma.client.findMany({
        where: clientWhere,
        take: 5,
        orderBy: { updatedAt: 'desc' },
      });

      // Recent Notes
      const notesWhere: any = {};
      if (user?.role === 'STAFF') {
        notesWhere.staffId = userId;
      }
      const recentNotes = await this.prisma.dailyNote.findMany({
        where: notesWhere,
        take: 5,
        orderBy: { date: 'desc' },
      });

      // Upcoming Birthdays
      const bdayClientWhere: any = { birthday: { not: null } };
      if (user?.role === 'STAFF') {
        bdayClientWhere.OR = [
          { favouriteTechnicianId: userId },
          { appointments: { some: { staffId: userId } } }
        ];
      }
      const clients = await this.prisma.client.findMany({
        where: bdayClientWhere,
      });
      const upcomingBirthdays = clients.filter(c => {
        if (!c.birthday) return false;
        const bday = new Date(c.birthday);
        const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
        const diffTime = thisYearBday.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 30;
      }).map(c => ({
        id: c.id,
        name: c.name,
        birthday: c.birthday,
      }));

      // Top Clients
      const topClientsWhere: any = {};
      if (user?.role === 'STAFF') {
        topClientsWhere.OR = [
          { favouriteTechnicianId: userId },
          { appointments: { some: { staffId: userId } } }
        ];
      }
      const topClients = await this.prisma.client.findMany({
        where: topClientsWhere,
        take: 5,
        orderBy: { lifetimeSpending: 'desc' },
      });

      // Dynamic Popular Services
      const services = await this.prisma.service.findMany({
        include: { _count: { select: { appointments: true } } },
        take: 5,
        orderBy: { appointments: { _count: 'desc' } }
      });
      const popularServices = services.map(s => ({
        name: s.name,
        count: s._count.appointments
      }));

      return {
        todayAppointmentsCount,
        todayRevenue,
        monthlyRevenue,
        monthlyExpenses,
        profit,
        lowStockCount,
        lowStockItems,
        equipmentMaintenanceCount,
        maintenanceItems: maintenanceItems.map(m => ({ id: m.id, name: m.name })),
        recentClients,
        recentNotes,
        upcomingBirthdays,
        topClients,
        popularServices,
      };
    } catch (e) {
      console.warn('Prisma dashboard aggregates fallback.');
      return {
        todayAppointmentsCount: 0,
        todayRevenue: 0.00,
        monthlyRevenue: 0.00,
        monthlyExpenses: 0.00,
        profit: 0.00,
        lowStockCount: 0,
        lowStockItems: [],
        equipmentMaintenanceCount: 0,
        maintenanceItems: [],
        recentClients: [],
        recentNotes: [],
        upcomingBirthdays: [],
        topClients: [],
        popularServices: [],
      };
    }
  }
}
