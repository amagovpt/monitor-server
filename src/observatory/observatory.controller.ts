import { Controller, Get } from '@nestjs/common';
import { PageService } from '../page/page.service';
import { success } from '../lib/response';

@Controller('observatory')
export class ObservatoryController {

  constructor(private readonly pageService: PageService) { }

  @Get()
  async getData(): Promise<any> {
    return success(await this.pageService.getObservatoryData());
  }
}
