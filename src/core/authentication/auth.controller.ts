import {
  Controller,
  UnauthorizedException,
  Request,
  Post,
  UseGuards,
  Get,
  Res,
  UseInterceptors,
  HttpCode,
  Body,
} from '@nestjs/common';
import { TrackMetric } from 'src/core/telemetry/decorators/trace.decorator';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { AutenticacaoGovGuard } from './guards/autenticacao-gov.guard';
import { LoggingInterceptor } from 'src/core/log/log.interceptor';

import { AuthDocs } from './auth.swagger';
import { LocalLoginDto } from './dto/local-login.dto';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { Protected } from 'src/core/authorization/decorators/protected.decorator';
import { Public } from 'src/core/authorization/decorators/public.decorator';

@AuthDocs.controller()
@Controller('auth')
@UseInterceptors(LoggingInterceptor)
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  @AuthDocs.login()
  @Public({ reason: 'Local credential login must be reachable without a token' })
  @Post('login')
  @HttpCode(200)
  @TrackMetric('login')
  async login(@Body() userLoginDto: LocalLoginDto): Promise<any> {
    const result = await this.authService.loginLocal(userLoginDto.username, userLoginDto.password);
    if (!result || !result.token) {
      throw new UnauthorizedException();
    }
    this.authService.updateUserLastLogin(result.id);

    return {
      token: result.token,
      amsEnv: result.amsEnv,
      authorizationLevel: result.authorizationLevel,
    };
  }

  @AuthDocs.logout()
  @Protected({ roles: 'authenticated' })
  @Post('logout')
  @HttpCode(200)
  async logout(@Request() req: any): Promise<void> {
    const token = req.headers.authorization.split(' ')[1];
    await this.authService.logout(token);
  }

  @AuthDocs.loginGov()
  @Public({ reason: 'Starts the Autenticacao.gov redirect flow before any token exists' })
  @HttpCode(200)
  @Get('login')
  async loginGov(@Res() response: Response): Promise<void> {
    const REDIRECT_URI = process.env.REDIRECT_URI;
    const CLIENT_ID = process.env.CLIENT_ID;
    const AUTH_SERVER = this.configService.get('AUTH_SERVER');

    response.redirect(
      `https://preprod.autenticacao.gov.pt/oauth/askauthorization?redirect_uri=${REDIRECT_URI}&client_id=${CLIENT_ID}&response_type=token&scope=http://interop.gov.pt/MDC/Cidadao/NIC%20http://interop.gov.pt/MDC/Cidadao/NomeCompleto`,
    );
  }

  @AuthDocs.verifyToken()
  @Public({ reason: 'Authenticated by AutenticacaoGovGuard via the gov access_token, not by JWT' })
  @UseGuards(AutenticacaoGovGuard)
  @Get('loginRedirect')
  async verifyToken(@Request() req: any): Promise<{ token: string }> {
    const token = this.authService.generateAuthToken(req.user);

    await this.authService.updateUserLastLogin(req.user.id);

    return { token };
  }
}
