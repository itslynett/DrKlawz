import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PublicBookingService } from './public-booking.service';

@Controller('public-booking')
export class PublicBookingController {
  constructor(private readonly bookingService: PublicBookingService) {}

  @Get('services')
  getServices() {
    return this.bookingService.getServices();
  }

  @Get('technicians')
  getTechnicians() {
    return this.bookingService.getTechnicians();
  }

  @Get('available-slots')
  getAvailableSlots(
    @Query('techId') techId: string,
    @Query('date') date: string,
  ) {
    return this.bookingService.getAvailableSlots(techId, date);
  }

  @Post()
  bookAppointment(@Body() bookingDto: any) {
    return this.bookingService.bookAppointment(bookingDto);
  }
}
