import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import mysqldump from 'mysqldump';


@Injectable()
export class DumpService {
   databaseConfig = JSON.parse(
    readFileSync("../../monitor_db.json").toString()
  );
  path = './dump.sql.gz';
  createDump() {
    mysqldump({
      connection: {
        host: this.databaseConfig.host,
        user: this.databaseConfig.user,
        password: this.databaseConfig.password,
        database: this.databaseConfig.database,
      },
      dumpToFile: this.path,
      compressFile: true,
    });
  }

}
