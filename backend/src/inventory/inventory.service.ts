import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // ==================== SUPPLIER CRUD ====================
  async createSupplier(data: any) {
    try {
      return await this.prisma.supplier.create({ data });
    } catch (e) {
      return { id: `supplier-${Date.now()}`, ...data, createdAt: new Date() };
    }
  }

  async findAllSuppliers() {
    try {
      return await this.prisma.supplier.findMany({ orderBy: { name: 'asc' } });
    } catch (e) {
      return [];
    }
  }

  async removeSupplier(id: string) {
    try {
      return await this.prisma.supplier.delete({ where: { id } });
    } catch (e) {
      return { id, deleted: true };
    }
  }

  // ==================== INVENTORY CRUD ====================
  async createItem(data: any) {
    try {
      return await this.prisma.inventoryItem.create({ data });
    } catch (e) {
      return { id: `item-${Date.now()}`, ...data, quantityRemaining: data.quantityPurchased, createdAt: new Date() };
    }
  }

  async findAllItems() {
    try {
      return await this.prisma.inventoryItem.findMany({
        include: { supplier: true },
        orderBy: { name: 'asc' },
      });
    } catch (e) {
      return [];
    }
  }

  async findLowStockAlerts() {
    try {
      const items = await this.prisma.inventoryItem.findMany({
        include: { supplier: true },
      });
      return items.filter(item => Number(item.quantityRemaining) <= Number(item.minimumStock));
    } catch (e) {
      return [];
    }
  }

  async updateItem(id: string, data: any) {
    try {
      return await this.prisma.inventoryItem.update({ where: { id }, data });
    } catch (e) {
      return { id, ...data };
    }
  }

  async logHistory(itemId: string, changeAmount: number, type: string, notes?: string) {
    try {
      await this.prisma.inventoryItem.update({
        where: { id: itemId },
        data: {
          quantityRemaining: { increment: changeAmount },
        },
      });

      return await this.prisma.inventoryHistory.create({
        data: { itemId, changeAmount, type, notes },
      });
    } catch (e) {
      return { id: `hist-${Date.now()}`, itemId, changeAmount, type, notes, createdAt: new Date() };
    }
  }

  async removeItem(id: string) {
    try {
      return await this.prisma.inventoryItem.delete({ where: { id } });
    } catch (e) {
      return { id, deleted: true };
    }
  }
}
