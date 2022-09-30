import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';

@Injectable()
export class GovAuthGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private readonly authService: AuthService,
    ) { }
    /**
     *
     */
    //https://stackoverflow.com/questions/58714466/in-nestjs-is-there-any-way-to-pass-data-from-guards-to-the-controller

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = request.query.access_token;
        console.log(token);
        const user = await this.authService.verifyLoginUser(token);
        console.log(user);
        const validUser = user?.entities.length > 0
        if (validUser) {
            request.user = user.entities[0]
        }
        console.log(validUser);
        return validUser;
    }
}