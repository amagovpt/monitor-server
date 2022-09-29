import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Connection, Repository, getManager } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { User } from "../user/user.entity";
import { InvalidToken } from "./invalid-token.entity";
import { comparePasswordHash } from "../lib/security";
import axios from "axios";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(InvalidToken)
    private readonly invalidTokenRepository: Repository<InvalidToken>,
    private readonly connection: Connection,
    private readonly jwtService: JwtService
  ) { }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanInvalidSessionTokens(): Promise<void> {
    // Called at midnight every day
    const manager = getManager();
    await manager.query(
      `DELETE FROM Invalid_Token WHERE Expiration_Date < NOW()`
    );
  }

  async isTokenBlackListed(token: string): Promise<boolean> {
    const invalidToken = await this.invalidTokenRepository.findOne({
      where: { Token: token },
    });
    return !!invalidToken;
  }

  async updateUserLastLogin(userId: number, date: any): Promise<boolean> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    let error = false;
    try {
      await queryRunner.manager.update(
        User,
        { UserId: userId },
        { Last_Login: date }
      );
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

  async verifyUserCredentials(
    username: string,
    password: string
  ): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { Username: username },
    });

    if (user && (await comparePasswordHash(password, user.Password))) {
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
    const user = await this.userRepository.findOne({
      where: {
        UserId: payload.sub,
        Username: payload.username,
        Type: payload.type,
        Unique_Hash: payload.hash,
      },
    });
    return !!user;
  }

  login(user: any): string {
    const payload = {
      username: user.Username,
      sub: user.UserId,
      type: user.Type,
      hash: user.Unique_Hash,
    };
    return this.signToken(payload);
  }

  signToken(payload: any): string {
    return this.jwtService.sign(payload);
  }

  verifyJWT(jwt: string): any {
    try {
      return this.jwtService.verify(jwt);
    } catch (err) {
      console.log(err);
      return undefined;
    }
  }

  async logout(token: string): Promise<any> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const invalidToken = new InvalidToken();
    invalidToken.Token = token;
    invalidToken.Expiration_Date = tomorrow;

    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    let error = false;
    try {
      const saved = await queryRunner.manager.save(invalidToken);
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

  async getAtributes(token: string) {
    console.log(token);
    const atributesName = ["http://interop.gov.pt/MDC/Cidadao/NIC"]
    axios.post("https://preprod.autenticacao.gov.pt/oauthresourceserver/api/AttributeManager", { token, atributesName }).catch((e) => { console.log(e) });//{token, authenticationContextId }
    const responseStart = await axios.post("https://preprod.autenticacao.gov.pt/oauthresourceserver/api/AttributeManager", { token, atributesName })
    const authenticationContextId = responseStart.data.authenticationContextId;
    console.log(responseStart.data)
    const responseAtributes = await axios.get(`https://preprod.autenticacao.gov.pt/oauthresourceserver/api/AttributeManager?token=${token}&authenticationContextId=${authenticationContextId}`)
    console.log(responseAtributes.data);
    return responseAtributes;
  }
}
