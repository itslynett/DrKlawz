import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AIService } from './ai-service.interface';
import { GeminiProvider } from './providers/gemini.provider';
import { MockProvider } from './providers/mock.provider';
import { DailyNotesService } from './daily-notes.service';
import { DailyNotesController } from './daily-notes.controller';

@Module({
  imports: [ConfigModule],
  providers: [
    GeminiProvider,
    MockProvider,
    {
      provide: AIService,
      useFactory: (configService: ConfigService, gemini: GeminiProvider, mock: MockProvider) => {
        const apiKey = configService.get<string>('GEMINI_API_KEY');
        if (apiKey) {
          console.log('[DailyNotesModule] Injecting GeminiProvider as AIService.');
          return gemini;
        } else {
          console.log('[DailyNotesModule] Injecting MockProvider (offline parser) as AIService.');
          return mock;
        }
      },
      inject: [ConfigService, GeminiProvider, MockProvider],
    },
    DailyNotesService,
  ],
  controllers: [DailyNotesController],
  exports: [DailyNotesService],
})
export class DailyNotesModule {}
