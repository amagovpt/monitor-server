import { Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
declare const JwtMonitorStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtMonitorStrategy extends JwtMonitorStrategy_base {
    private readonly authService;
    constructor(authService: AuthService);
    validate(payload: any): Promise<any>;
}
export {};
