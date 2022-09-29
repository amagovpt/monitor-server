import {
  Controller,
  InternalServerErrorException,
  UnauthorizedException,
  Request,
  Post,
  UseGuards,
  Get,
  Param,
  Query,
  Res,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { success } from "../lib/response";
import { Response } from 'express';

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) { }

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

  @UseGuards(AuthGuard("jwt"))
  @Post("logout")
  async logout(@Request() req: any): Promise<any> {
    const token = req.headers.authorization.split(" ")[1];
    return success(await this.authService.logout(token));
  }

  //@UseGuards()
  @Get("login")
  async loginGov( @Res() response: Response): Promise<any> {
    const REDIRECT_URI = "http://10.55.37.16/mm2/loginRedirect";
    const CLIENT_ID = "5679267266509668091";
    response.redirect(`https://preprod.autenticacao.gov.pt/oauth/askauthorization?redirect_uri=${REDIRECT_URI}&client_id=${CLIENT_ID}&response_type=token&scope=http://interop.gov.pt/MDC/Cidadao/NIC`);
  }
  @Get("loginRedirect")
  async verifyToken(@Query() query): Promise<any> {
    const token = query.token;
    const atributes = this.authService.getAtributes(token);


  }
}
