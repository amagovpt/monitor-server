import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { readFileSync, readdirSync, unlinkSync } from 'fs';
import mysqldump from 'mysqldump';
import { Directory } from 'src/directory/directory.entity';
import { Dump } from './entities/dump.entity';
import { Repository} from "typeorm";



@Injectable()
export class DumpService {
  constructor(
    @InjectRepository(Directory)
    private readonly dumpRepository: Repository<Dump>) { }
    databaseConfig = JSON.parse(
     readFileSync("../monitor_db2.json").toString()
  );
  createDump() {
    const date = new Date();
    const fileName = "./dump" + date.toISOString();
    this.create(fileName,date);
    mysqldump({
      connection: {
        host: this.databaseConfig.host,
        user: this.databaseConfig.user,
        password: this.databaseConfig.password,
        database: this.databaseConfig.database,
      },
      dumpToFile: fileName,
      compressFile: true,
    });
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
