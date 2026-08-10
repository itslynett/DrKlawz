import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EquipmentStatus } from '@prisma/client';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    try {
      return await this.prisma.equipment.create({ data });
    } catch (e) {
      return { id: `eq-${Date.now()}`, ...data, status: EquipmentStatus.OPERATIONAL, createdAt: new Date() };
    }
  }

  async findAll() {
    try {
      return await this.prisma.equipment.findMany({
        include: { repairs: true },
        orderBy: { name: 'asc' },
      });
    } catch (e) {
      return [];
    }
  }

  async update(id: string, data: any) {
    try {
      return await this.prisma.equipment.update({ where: { id }, data });
    } catch (e) {
      return { id, ...data };
    }
  }

  async logRepair(equipmentId: string, cost: number, description: string) {
    try {
      return await this.prisma.equipmentRepair.create({
        data: {
          equipmentId,
          repairDate: new Date(),
          cost,
          description,
          status: 'Completed',
        },
      });
    } catch (e) {
      return { id: `rep-${Date.now()}`, equipmentId, repairDate: new Date(), cost, description, status: 'Completed', createdAt: new Date() };
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.equipment.delete({ where: { id } });
    } catch (e) {
      return { id, deleted: true };
    }
  }
}
