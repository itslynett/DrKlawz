import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ==================== SUPPLIER ROUTING ====================
  @Post('suppliers')
  createSupplier(@Body() data: any) {
    return this.inventoryService.createSupplier(data);
  }

  @Get('suppliers')
  findAllSuppliers() {
    return this.inventoryService.findAllSuppliers();
  }

  @Delete('suppliers/:id')
  removeSupplier(@Param('id') id: string) {
    return this.inventoryService.removeSupplier(id);
  }

  // ==================== INVENTORY ITEM ROUTING ====================
  @Post('items')
  createItem(@Body() data: any) {
    return this.inventoryService.createItem(data);
  }

  @Get('items')
  findAllItems() {
    return this.inventoryService.findAllItems();
  }

  @Get('alerts/low-stock')
  findLowStockAlerts() {
    return this.inventoryService.findLowStockAlerts();
  }

  @Put('items/:id')
  updateItem(@Param('id') id: string, @Body() data: any) {
    return this.inventoryService.updateItem(id, data);
  }

  @Delete('items/:id')
  removeItem(@Param('id') id: string) {
    return this.inventoryService.removeItem(id);
  }

  @Post('items/:id/history')
  logHistory(
    @Param('id') id: string,
    @Body('changeAmount') changeAmount: number,
    @Body('type') type: string,
    @Body('notes') notes?: string,
  ) {
    return this.inventoryService.logHistory(id, changeAmount, type, notes);
  }
}
