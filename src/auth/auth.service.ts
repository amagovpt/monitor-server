import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/user.entity';
import { generatePasswordHash, comparePasswordHash } from '../lib/security';

@Injectable()
export class AuthService {

  private saltRounds: number = 10;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly connection: Connection,
    private readonly jwtService: JwtService
  ) { }

  async updateUserLastLogin(userId: number, date: any): Promise<boolean> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    let error = false;
    try {
      await queryRunner.manager.update(User, { UserId: userId }, { Last_Login: date });
      await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      error = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !error;
  }

  async verifyUserCredentials(username: string, password: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { Username: username } });
    
    if (user && await comparePasswordHash(password, user.Password)) {
      delete user.Password;
      delete user.Names;
      delete user.Emails;
      delete user.Last_Login;
      delete user.Register_Date;
      return user;
    } else {
      return null;
    }
  }

  async verifyUserPayload(payload: any): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { UserId: payload.sub, Username: payload.username, Type: payload.type, Unique_Hash: payload.hash } });
    return !!user;
  }

  async login(user: any): Promise<any> {
    const payload = { username: user.Username, sub: user.UserId, type: user.Type, hash: user.Unique_Hash };
    return this.jwtService.sign(payload);
  }
}
