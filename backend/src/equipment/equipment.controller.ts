import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  create(@Body() data: any) {
    return this.equipmentService.create(data);
  }

  @Get()
  findAll() {
    return this.equipmentService.findAll();
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.equipmentService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.equipmentService.remove(id);
  }

  @Post(':id/repairs')
  logRepair(
    @Param('id') id: string,
    @Body('cost') cost: number,
    @Body('description') description: string,
  ) {
    return this.equipmentService.logRepair(id, cost, description);
  }
}
