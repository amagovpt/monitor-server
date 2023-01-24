import { Injectable } from '@nestjs/common';
import { readFileSync, readdirSync, unlinkSync } from 'fs';
import mysqldump from 'mysqldump';


@Injectable()
export class DumpService {
   databaseConfig = JSON.parse(
    readFileSync("../monitor_db.json").toString()
  );
  createDump() {
    const date = new Date()
    mysqldump({
      connection: {
        host: this.databaseConfig.host,
        user: this.databaseConfig.user,
        password: this.databaseConfig.password,
        database: this.databaseConfig.database,
      },
      dumpToFile: "./dump"+date.toISOString(),
      compressFile: true,
    });
  }

  listDumps() {
    return readdirSync('./').filter(e => e.includes("dump"));
  }

  async deleteDump(fileName: string) {
    unlinkSync(fileName);
  }

}
