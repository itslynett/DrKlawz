import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('income')
  createIncome(@Body() data: any) {
    return this.financeService.createIncome(data);
  }

  @Get('income')
  findAllIncome() {
    return this.financeService.findAllIncome();
  }

  @Post('expenses')
  createExpense(@Body() data: any) {
    return this.financeService.createExpense(data);
  }

  @Get('expenses')
  findAllExpenses() {
    return this.financeService.findAllExpenses();
  }

  @Get('dashboard/stats')
  getDashboardStats(@Request() req: any) {
    return this.financeService.getDashboardStats(req.user);
  }
}
