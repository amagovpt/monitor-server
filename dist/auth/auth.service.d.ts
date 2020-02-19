import { Connection, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/user.entity';
import { InvalidToken } from './invalid-token.entity';
export declare class AuthService {
    private readonly userRepository;
    private readonly invalidTokenRepository;
    private readonly connection;
    private readonly jwtService;
    private saltRounds;
    constructor(userRepository: Repository<User>, invalidTokenRepository: Repository<InvalidToken>, connection: Connection, jwtService: JwtService);
    cleanInvalidSessionTokens(): Promise<void>;
    isTokenBlackListed(token: string): Promise<any>;
    updateUserLastLogin(userId: number, date: any): Promise<boolean>;
    verifyUserCredentials(username: string, password: string): Promise<any>;
    verifyUserPayload(payload: any): Promise<boolean>;
    login(user: any): string;
    signToken(payload: any): string;
    logout(token: string): Promise<any>;
}
