import { Controller, Get, Header, Res } from '@nestjs/common';
import { Public } from '../auth/auth.decorators';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @Public()
  @Header('Cache-Control', 'no-store')
  async check(
    @Res({ passthrough: true }) response: { status(code: number): unknown },
  ) {
    const up = await this.health.checkDatabase();
    if (!up) response.status(503);
    return {
      status: up ? 'ok' : 'unavailable',
      api: 'up',
      database: up ? 'up' : 'down',
    };
  }
}
