import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import { CreateGovUserDto } from './dto/create-gov-user.dto';
import { UpdateGovUserDto } from './dto/update-gov-user.dto';
import { GovUser } from './entities/gov-user.entity';

@Injectable()
export class GovUserService {
  constructor(
    @InjectRepository(GovUser)
    private govUserRepository: Repository<GovUser>,){}

  create(createGovUserDto: CreateGovUserDto) {
    return this.addToDB(createGovUserDto);
  }
  addToDB(createGovUserDto: CreateGovUserDto){
    const newUser = this.govUserRepository.create(createGovUserDto);
    return this.govUserRepository.save(newUser);
  }

  async associateUser(user:User, id:number){
    const govUser = await this.findOne(id);
    govUser.entities.push(user);
    return this.govUserRepository.save(govUser);
  }

  findAll() {
    return this.govUserRepository.find({ relations: ["entities"] });
  }

  findOne(id: number) {
    return this.govUserRepository.findOne(id, { relations: ["entities"]});
  }

  async update(updateGovUserDto: UpdateGovUserDto) {
    return this.govUserRepository.save(updateGovUserDto);
  }

  remove(id: number) {
    return this.govUserRepository.delete(id);
  }
}
