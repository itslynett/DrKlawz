import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // ==================== SERVICE ENDPOINTS ====================
  @Post('services')
  createService(@Body() data: any) {
    return this.appointmentsService.createService(data);
  }

  @Get('services')
  findAllServices() {
    return this.appointmentsService.findAllServices();
  }

  @Put('services/:id')
  updateService(@Param('id') id: string, @Body() data: any) {
    return this.appointmentsService.updateService(id, data);
  }

  @Delete('services/:id')
  removeService(@Param('id') id: string) {
    return this.appointmentsService.removeService(id);
  }

  // ==================== APPOINTMENT ENDPOINTS ====================
  @Post()
  createAppointment(@Body() data: any) {
    return this.appointmentsService.createAppointment(data);
  }

  @Get()
  findAllAppointments(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.appointmentsService.findAllAppointments(req.user, startDate, endDate);
  }

  @Get(':id')
  findOneAppointment(@Param('id') id: string) {
    return this.appointmentsService.findOneAppointment(id);
  }

  @Put(':id')
  updateAppointment(@Param('id') id: string, @Body() data: any) {
    return this.appointmentsService.updateAppointment(id, data);
  }

  @Patch(':id')
  patchAppointment(@Param('id') id: string, @Body() data: any) {
    return this.appointmentsService.updateAppointment(id, data);
  }

  @Delete(':id')
  removeAppointment(@Param('id') id: string) {
    return this.appointmentsService.removeAppointment(id);
  }
}
