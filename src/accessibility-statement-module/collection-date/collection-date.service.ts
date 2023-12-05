import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionDate } from './entities/collection-date.entity';

@Injectable()
export class CollectionDateService {

  constructor(
    @InjectRepository(CollectionDate)
    private readonly collectionDateRepository: Repository<CollectionDate>) {
  }

  create() {
    const collection = this.collectionDateRepository.create({ createdAt: new Date() });
    return this.collectionDateRepository.save(collection);
  }

  findLatest() {
    return this.collectionDateRepository.findOne({ where: {}, order: { createdAt: 'DESC' } });
  }

}
