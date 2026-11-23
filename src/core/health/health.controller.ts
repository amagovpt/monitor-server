import { Controller, Get } from "@nestjs/common";
import { Protected } from 'src/core/authorization/decorators/protected.decorator';
import { HealthCheckService, HealthCheck } from "@nestjs/terminus";

@Controller("health")
export class HealthController {
  constructor(private health: HealthCheckService) {}

  @Get()
  @Protected({ roles: 'authenticated' })
  @HealthCheck()
  check() {
    return this.health.check([]);
  }
}
