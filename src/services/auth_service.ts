import bcrypt from "bcrypt";
import config from "config";
import jwt from "jsonwebtoken";
import { Md5 } from "md5-typescript";

export interface JwtToken {
  sub: string;
}

export default class AuthService {
  public static async hashPassword(
    password: string,
    salt = 10
  ): Promise<string> {
    return await bcrypt.hash(password, salt);
  }

  public static validResquestEmail(token: string, email: string): boolean {
    const hash = Md5.init(
      email.concat(".").concat(config.get("App.auth.web_token"))
    );
    return token == hash;
  }

  public static async comparePasswords(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  //Esse token só serve para usar a api
  public static generateToken(sub: string): string {
    return jwt.sign({ sub }, config.get("App.auth.key"), {
      expiresIn: config.get("App.auth.tokenExpiresIn"),
    });
  }

  //Esse token só serve para usar a api
  public static decodeToken(token: string): JwtToken {
    return jwt.verify(token, config.get("App.auth.key")) as JwtToken;
  }

  //Esse token só serve para enviar email com código para logar no aplicativo
  public static generateTokenAuthenticated(sub: string): string {
    return jwt.sign({ sub }, config.get("App.auth.key_login"), {
      expiresIn: config.get("App.auth.tokenExpiresIn"),
    });
  }

  //Esse token só serve para enviar email com código para logar no aplicativo
  public static decodeTokenAuthenticated(token: string): JwtToken {
    return jwt.verify(token, config.get("App.auth.key_login")) as JwtToken;
  }

  //Esse token só serve para enviar email com código para logar no aplicativo
  public static generateTokenAtivacao(sub: string): string {
    return jwt.sign({ sub }, config.get("App.auth.key_ativacao"), {
      expiresIn: config.get("App.auth.tokenExpiresIn"),
    });
  }

  //Esse token só serve para enviar email com código para logar no aplicativo
  public static decodeTokenAtivacao(token: string): JwtToken {
    return jwt.verify(token, config.get("App.auth.key_ativacao")) as JwtToken;
  }

  //Esse token só serve para enviar email com código para reset de password
  public static generateTokenResetPass(sub: string): string {
    return jwt.sign({ sub }, config.get("App.auth.key_reset"), {
      expiresIn: config.get("App.auth.tokenExpiresIn"),
    });
  }

  //Esse token só serve para enviar email com código para reset de password
  public static decodeTokenResetPassword(token: string): JwtToken {
    return jwt.verify(token, config.get("App.auth.key_reset")) as JwtToken;
  }
}
