import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const { favouriteColours, favouriteDesigns, ...rest } = data;
    try {
      return await this.prisma.client.create({
        data: {
          ...rest,
          favouriteColours: favouriteColours || [],
          favouriteDesigns: favouriteDesigns || [],
        },
      });
    } catch (e) {
      console.warn('Prisma create client offline fallback.');
      return {
        id: `client-${Date.now()}`,
        favouriteColours: favouriteColours || [],
        favouriteDesigns: favouriteDesigns || [],
        ...rest,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  async findAll(user: { id: string; role: string; sub?: string }, search?: string, status?: string) {
    const userId = user.id || user.sub || '';
    try {
      const where: any = {};
      if (user.role === 'STAFF') {
        where.OR = [
          { favouriteTechnicianId: userId },
          { appointments: { some: { staffId: userId } } }
        ];
      }
      if (search) {
        const searchFilter = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ];
        if (user.role === 'STAFF') {
          where.AND = [
            { OR: where.OR },
            { OR: searchFilter }
          ];
          delete where.OR;
        } else {
          where.OR = searchFilter;
        }
      }
      if (status) {
        where.status = status;
      }
      return await this.prisma.client.findMany({
        where,
        orderBy: { name: 'asc' },
        include: { photos: true },
      });
    } catch (e) {
      console.warn('Prisma find clients fallback.');
      return [];
    }
  }

  async findOne(id: string) {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id },
        include: { photos: true, appointments: true, payments: true },
      });
      if (!client) throw new NotFoundException('Client not found');
      return client;
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      return null;
    }
  }

  async update(id: string, data: any) {
    const { favouriteColours, favouriteDesigns, ...rest } = data;
    try {
      return await this.prisma.client.update({
        where: { id },
        data: {
          ...rest,
          favouriteColours: favouriteColours || undefined,
          favouriteDesigns: favouriteDesigns || undefined,
        },
      });
    } catch (e) {
      return { id, ...data, updatedAt: new Date() };
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.client.delete({ where: { id } });
    } catch (e) {
      return { id, deleted: true };
    }
  }

  async addPhoto(clientId: string, url: string, notes?: string) {
    try {
      return await this.prisma.clientPhoto.create({
        data: { clientId, url, notes },
      });
    } catch (e) {
      return { id: `photo-${Date.now()}`, clientId, url, notes, createdAt: new Date() };
    }
  }
}
