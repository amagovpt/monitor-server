import { Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
declare const JwtAdminStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtAdminStrategy extends JwtAdminStrategy_base {
    private readonly authService;
    constructor(authService: AuthService);
    validate(payload: any): Promise<any>;
}
export {};
