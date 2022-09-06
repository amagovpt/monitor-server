import { Test, TestingModule } from '@nestjs/testing';
import { GovUserService } from './gov-user.service';

describe('GovUserService', () => {
  let service: GovUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GovUserService],
    }).compile();

    service = module.get<GovUserService>(GovUserService);
  });

  it('should be defined', async () => {
    const JOSE = "Teste José";
    expect(service).toBeDefined();
    const initialList = await service.findAll();
    const user = await  service.create({CCNumber:"12343444",name: "Teste Manel"});
    expect(user).toBeDefined();
    const found = service.findOne(user.id);
    console.log(found);
    expect(found).toBeDefined();
    const userUpdated = await service.update({ id: user.id, name: JOSE });
    expect(userUpdated.name).toEqual(JOSE)
    const userRemoved = await service.remove( user.id);
    const finalList = await service.findAll();
    expect(finalList.length).toEqual(initialList.length)
  });
});
