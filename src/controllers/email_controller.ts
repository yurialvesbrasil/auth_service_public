import { Controller, Get, Middleware } from "@overnightjs/core";
import {
  xTokenAtivacaoMiddleware,
  xTokenLoginMiddleware,
  xTokenMiddleware,
  xTokenResetMiddleware,
} from "@src/middlewares/auth";
import { Codigo } from "@src/models/codigo_model";
import { Usuario } from "@src/models/usuario_model";
import { CodigoService } from "@src/services/codigo_service";
import { UsuarioService } from "@src/services/usuario_service";
import ApiError from "@src/util/errors/api-error";
import { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { BaseController } from ".";

const rateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute in milliseconds
  max: 10,
  keyGenerator(req: Request): string {
    return req.ip;
  },
  handler(_, res: Response): void {
    res.status(400).send(
      ApiError.format({
        code: 400,
        message: "Muitos requests para a mesma rota",
      })
    );
  },
});

@Controller("email")
export class EmailController extends BaseController {
  /* Envia código de ativação para o email do o usuário 
       ativar a conta, digitando o mesmo no local apropriado */
  @Get("enviar/codigo/ativacao/conta")
  @Middleware(rateLimiter)
  @Middleware(xTokenAtivacaoMiddleware)
  public async enviarCodigoAtivacao(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const id = req.params.userId;

      //Verifica se o usuário existe.
      const usuarioService = new UsuarioService();
      const user: Usuario | undefined = await usuarioService.getUsuarioById(id);
      if (!user)
        return this.sendErrorResponse(res, {
          message: "Usuário não existe.",
          code: 400,
        });

      //Verifica se a conta do usuário já está ativa
      const codigoService = new CodigoService();
      const codigos: Codigo | undefined = await codigoService.getCodigosById(
        user.idCodigo
      );
      if (
        codigos &&
        codigos.codigoAtivacao != null &&
        codigos.codigoAtivacao == ""
      )
        return this.sendErrorResponse(res, {
          message: "Este usuário já está ativo.",
          code: 500,
        });

      /// Chama método de envio de email
      const resposta = await usuarioService.sendEmailAtivacao(user);

      return res.status(resposta.code).send({ message: resposta.message });
    } catch (err) {
      return this.sendErrorResponse(res, {
        message: `${err.message}`,
        code: 500,
      });
    }
  }

  /* Envia código de login para o email do usuário 
       para usá-lo no login */
  @Get("enviar/codigo/login/conta")
  @Middleware(rateLimiter)
  @Middleware(xTokenLoginMiddleware)
  public async enviarCodigoLogin(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const id = req.params.userId;

      //Verifica se o usuário existe.
      const usuarioService = new UsuarioService();
      const user: Usuario | undefined = await usuarioService.getUsuarioById(id);
      if (!user)
        return this.sendErrorResponse(res, {
          message: "Usuário não existe.",
          code: 400,
        });

      //Verifica se a conta do usuário está ativa
      const codigoService = new CodigoService();
      const codigos: Codigo | undefined = await codigoService.getCodigosById(
        user.idCodigo
      );
      if (
        codigos &&
        codigos.codigoAtivacao &&
        codigos.codigoAtivacao != null &&
        codigos.codigoAtivacao != ""
      )
        return this.sendErrorResponse(res, {
          message: "Este usuário não está ativo.",
          code: 500,
        });

      /// Chama método
      const resposta = await usuarioService.sendEmailCodigoLogin(user);
      return res.status(resposta.code).send({ message: resposta.message });
    } catch (err) {
      return this.sendErrorResponse(res, {
        message: `${err.message}`,
        code: 500,
      });
    }
  }

  @Get("enviar/codigo/reset/password")
  @Middleware(rateLimiter)
  @Middleware(xTokenResetMiddleware)
  public async enviaCodigoResetPassword(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const id = req.params.userId;

      //Verifica se o usuário existe.
      const usuarioService = new UsuarioService();
      const user: Usuario | undefined = await usuarioService.getUsuarioById(id);
      if (!user)
        return this.sendErrorResponse(res, {
          message: "Usuário não existe.",
          code: 400,
        });

      //Verifica se a conta do usuário está ativa
      const codigoService = new CodigoService();
      const codigos: Codigo | undefined = await codigoService.getCodigosById(
        user.idCodigo
      );
      if (
        codigos &&
        codigos.codigoAtivacao &&
        codigos.codigoAtivacao != null &&
        codigos.codigoAtivacao != ""
      )
        return this.sendErrorResponse(res, {
          message: "Este usuário não está ativo.",
          code: 500,
        });

      /// Chama método
      const resposta = await usuarioService.sendEmailCodigoResetPass(user);
      return res.status(resposta.code).send({ message: resposta.message });
    } catch (err) {
      return this.sendErrorResponse(res, {
        message: `${err.message}`,
        code: 500,
      });
    }
  }
}
