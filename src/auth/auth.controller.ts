import {
  Controller,
  InternalServerErrorException,
  UnauthorizedException,
  Request,
  Post,
  UseGuards,
  Get,
  Res,
  UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { success } from "../lib/response";
import { Response } from 'express';
import { GovAuthGuard } from "./gov-auth.guard";
import { LoggingInterceptor } from "src/log/log.interceptor";
import { ApiBasicAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";


@ApiBasicAuth()
@ApiTags('auth')
@ApiResponse({ status: 403, description: 'Forbidden' })
@Controller("auth")
@UseInterceptors(LoggingInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @ApiOperation({ summary: 'Login in AMS' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("local"))
  @Post("login")
  async login(@Request() req: any): Promise<any> {
    const token = this.authService.login(req.user);
    if (req.user.Type !== req.body.type) {
      throw new UnauthorizedException();
    } else {
      const date = new Date()
        .toISOString()
        .replace(/T/, " ")
        .replace(/\..+/, "");
      const updatedLogin = await this.authService.updateUserLastLogin(
        req.user.UserId,
        date
      );
      if (!updatedLogin) {
        throw new InternalServerErrorException();
      }

      return success(token);
    }
  }

  @ApiOperation({ summary: 'Logout in AMS and MyMonitor' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt"))
  @Post("logout")
  async logout(@Request() req: any): Promise<any> {
    const token = req.headers.authorization.split(" ")[1];
    return success(await this.authService.logout(token));
  }
  @ApiOperation({ summary: 'Start login using Autenticação.Gov(My Monitor)' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Boolean,
  })
  //@UseGuards()
  @Get("login")
  async loginGov(@Res() response: Response): Promise<any> {
    const REDIRECT_URI = process.env.REDIRECT_URI;
    const CLIENT_ID = process.env.CLIENT_ID;
    response.redirect(`https://preprod.autenticacao.gov.pt/oauth/askauthorization?redirect_uri=${REDIRECT_URI}&client_id=${CLIENT_ID}&response_type=token&scope=http://interop.gov.pt/MDC/Cidadao/NIC%20http://interop.gov.pt/MDC/Cidadao/NomeCompleto`);
  }

  @ApiOperation({ summary: 'After a successful login in AGov the user is redirected to this operation to verify the AGov token and login the user in MyMonitor' })
  @ApiResponse({
    status: 200,
    description: 'The user login was successfull',
    type: String,
  })
  @UseGuards(GovAuthGuard)
  @Get("loginRedirect")
  async verifyToken(@Request() req: any): Promise<any> {
    const token = this.authService.login(req.user);
    const date = new Date()
      .toISOString()
      .replace(/T/, " ")
      .replace(/\..+/, "");
    const updatedLogin = await this.authService.updateUserLastLogin(
      req.user.UserId,
      date
    );
    if (!updatedLogin) {
      throw new InternalServerErrorException();
    }
    console.log(token);
    return success(token);
  }
}
