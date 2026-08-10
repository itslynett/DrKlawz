import { Controller, Post, Get, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { DailyNotesService } from './daily-notes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('daily-notes')
export class DailyNotesController {
  constructor(private dailyNotesService: DailyNotesService) {}

  @Post()
  async createNote(@Request() req: any, @Body('rawText') rawText: string, @Body('fileUrl') fileUrl?: string) {
    return this.dailyNotesService.createNote(req.user, rawText, fileUrl);
  }

  @Get()
  async getNotes(@Request() req: any) {
    return this.dailyNotesService.getNotes(req.user);
  }

  @Get(':id')
  async getNote(@Param('id') id: string) {
    return this.dailyNotesService.getNote(id);
  }

  @Delete(':id')
  async deleteNote(@Param('id') id: string) {
    return this.dailyNotesService.deleteNote(id);
  }

  @Post('extractions/:extractionId/confirm')
  async confirmExtraction(@Param('extractionId') extractionId: string) {
    return this.dailyNotesService.confirmExtraction(extractionId);
  }
}
