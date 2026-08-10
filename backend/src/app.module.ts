import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { InventoryModule } from './inventory/inventory.module';
import { EquipmentModule } from './equipment/equipment.module';
import { FinanceModule } from './finance/finance.module';
import { DailyNotesModule } from './daily-notes/daily-notes.module';
import { PublicBookingModule } from './public-booking/public-booking.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    ClientsModule,
    AppointmentsModule,
    InventoryModule,
    EquipmentModule,
    FinanceModule,
    DailyNotesModule,
    PublicBookingModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
