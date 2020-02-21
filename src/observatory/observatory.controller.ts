import { Controller, Get } from '@nestjs/common';
import { PageService } from '../page/page.service';

@Controller('observatory')
export class ObservatoryController {

  constructor(private readonly pageService: PageService) { }

  @Get()
  getData(): Promise<any> {
    return this.pageService.getObservatoryData();
  }
}
