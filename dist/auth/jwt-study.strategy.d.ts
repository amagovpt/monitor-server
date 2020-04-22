import { Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
declare const JwtStudyStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStudyStrategy extends JwtStudyStrategy_base {
    private readonly authService;
    constructor(authService: AuthService);
    validate(payload: any): Promise<any>;
}
export {};
