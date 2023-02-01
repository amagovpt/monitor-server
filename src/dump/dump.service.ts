import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { readFileSync, unlinkSync } from 'fs';
import mysqldump from 'mysqldump';
import { Directory } from 'src/directory/directory.entity';
import { Dump } from './entities/dump.entity';
import { Repository} from "typeorm";



@Injectable()
export class DumpService {
  constructor(
    @InjectRepository(Dump)
    private readonly dumpRepository: Repository<Dump>) {}

  create(fileName: string, date:Date){
    const dump = this.dumpRepository.create({ fileName, date, ended: false });
    return this.dumpRepository.save(dump);
  }
  databaseConfig = JSON.parse(
    readFileSync("../monitor_db.json").toString()
  );
  async createDump() {
    const date = new Date();
    const fileName = "./dump" + date.toISOString();
    const dump = await this.create(fileName, date);
    await mysqldump({
      connection: {
        host: this.databaseConfig.host,
        user: this.databaseConfig.user,
        password: this.databaseConfig.password,
        database: this.databaseConfig.database,
      },
      dumpToFile: fileName,
      compressFile: true,
    });
    return await this.updateState(dump);
  }

  updateState(dump:Dump){
    return this.dumpRepository.update(dump.id,{ended:true});
  }

  listDumps() {
    return this.dumpRepository.find();
  }

  async deleteDump(fileName: string) {
    unlinkSync(fileName);
    return this.dumpRepository.delete({fileName});
  }

}
