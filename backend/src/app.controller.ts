import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getApiStatus() {
    return {
      name: 'Dr. Klawz Operating System API',
      status: 'online',
      version: '1.0.0',
      frontendUrl: 'http://localhost:3000',
      timestamp: new Date().toISOString(),
    };
  }
}
