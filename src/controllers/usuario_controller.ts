import { Controller, Post, Get, Middleware } from "@overnightjs/core";
import { Response, Request } from "express";
import { BaseController } from "./index";
import {
  authMiddleware,
  xTokenMiddleware,
  xTokenResetMiddleware,
} from "@src/middlewares/auth";
import rateLimit from "express-rate-limit";
import * as yup from "yup";
import { UsuarioService } from "@src/services/usuario_service";
import { Usuario } from "@src/models/usuario_model";
import { EmpresaService } from "@src/services/empresa_service";
import ApiError from "@src/util/errors/api-error";
import { IServiceResponse } from "@src/util/payload/response";
import logger from "@src/logger";
import { CodigoService } from "@src/services/codigo_service";
import { Codigo } from "@src/models/codigo_model";
import AuthService from "@src/services/auth_service";
import { CodigoAtivacao } from "@src/util/codigo-ativacao";

const rateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute in milliseconds
  max: 10,
  keyGenerator(req: Request): string {
    return req.ip;
  },
  handler(_, res: Response): void {
    res.status(406).send(
      ApiError.format({
        code: 406,
        message: "Muitos requests para a mesma rota",
      })
    );
  },
});

@Controller("usuario")
export class UsersController extends BaseController {
  @Post("")
  @Middleware(rateLimiter)
  @Middleware(xTokenMiddleware)
  public async create(req: Request, res: Response): Promise<Response> {
    try {
      const emailHeader = req.headers?.["email"];
      /*eslint-disable @typescript-eslint/camelcase*/
      const { nome, telefone, email, senha, id_empresa, foto } = req.body;

      //Valida dados de entrada (foto) -> não é obrigatório
      /*eslint-disable @typescript-eslint/camelcase*/
      const schema = yup.object().shape({
        nome: yup.string().required(),
        telefone: yup.string().required(),
        email: yup.string().email().required(),
        senha: yup.string().required(),
        id_empresa: yup.string().required(),
      });

      try {
        await schema.validate(req.body, { abortEarly: false });
      } catch (error) {
        return this.sendErrorResponse(res, {
          message: "Parâmetros inválidos",
          code: 400,
        });
      }

      //Verifica consistência de parâmetros
      if (emailHeader != email) {
        return this.sendErrorResponse(res, {
          message: "Parâmetros inválidos.",
          code: 400,
        });
      }

      //Verifica se a empresa em que o usuário está atrelado, existe.
      const empresaService = new EmpresaService();
      const empresa = await empresaService.getEmpresaById(id_empresa);
      if (!empresa)
        return this.sendErrorResponse(res, {
          message: "Empresa associada a este usuário não existe.",
          code: 404,
        });

      //Verifica se o usuário já existe.
      const usuarioService = new UsuarioService();
      const findedUser = await usuarioService.getUsuarioByEmail(email);
      if (findedUser) {
        //Verifica se usuário já está ativo
        if (
          findedUser.codigo.codigoAtivacao != null &&
          findedUser.codigo.codigoAtivacao != ""
        )
          return this.sendErrorResponse(res, {
            message: `Este usuário já está ativo.`,
            code: 409,
          });

        //Cria token para envio de código de ativação de conta
        const token = AuthService.generateTokenAtivacao(findedUser.id);
        logger.info(`Usuário já existe ${findedUser?.email}`);

        return res.status(201).send({
          code: 201,
          message: "Usuário já existe.",
          token: token,
        });
      }

      //Cria novo usuário
      /*eslint-disable @typescript-eslint/camelcase*/
      const user: Usuario = await usuarioService.create({
        nome,
        telefone,
        email,
        senha,
        idEmpresa: id_empresa,
        foto,
      });

      if (!user)
        return this.sendErrorResponse(res, {
          message: "Usuário não criado.",
          code: 500,
        });

      //Cria token para envio de código de ativação de conta
      const token = AuthService.generateTokenAtivacao(user.id);

      return res.status(201).send({
        code: 201,
        message: "Usuário criado com sucesso.",
        token: token,
        usuario: {
          nome: user.nome,
          foto: user.foto,
          email: user.email,
          telefone: user.telefone,
          idEmpresa: user.idEmpresa,
        },
      });
    } catch (err) {
      return this.sendErrorResponse(res, {
        message: `${err.message}`,
        code: 500,
      });
    }
  }

  //Ativa conta de usuário
  @Get("ativar")
  @Middleware(rateLimiter)
  @Middleware(xTokenMiddleware)
  public async ativar(req: Request, res: Response): Promise<Response> {
    try {
      const email = req.headers["email"];
      const codigo = req.headers["codigo"];

      //Verifica se foi passado algum email e o código
      if (!email || !codigo)
        return this.sendErrorResponse(res, {
          message: "Bad request",
          code: 400,
        });

      //Verifica se o usuário existe.
      const usuarioService = new UsuarioService();
      const findedUser = await usuarioService.getUsuarioByEmail(String(email));
      if (!findedUser)
        return this.sendErrorResponse(res, {
          message: "Usuário não existe.",
          code: 404,
        });

      //Verifica se a conta do usuário já está ativa
      const codigoService = new CodigoService();
      const codigoUser = await codigoService.getCodigosById(
        findedUser.idCodigo
      );
      if (
        codigoUser &&
        codigoUser.codigoAtivacao != null &&
        codigoUser.codigoAtivacao == ""
      )
        return this.sendErrorResponse(res, {
          message: `Este usuário já está ativo.`,
          code: 409,
        });

      //Verifica se codigo confere com o do usuário
      if (codigoUser && codigoUser.codigoAtivacao != codigo)
        return this.sendErrorResponse(res, {
          message: "Código inválido",
          code: 401,
        });

      const resposta: IServiceResponse = await usuarioService.ativa(findedUser);

      return res.status(resposta.code).send(resposta);
    } catch (err) {
      return this.sendErrorResponse(res, {
        message: `${err.message}`,
        code: 500,
      });
    }
  }

  //Autentica email e senha do usuário e envia toquen para senha de dois fatores
  @Get("authenticated")
  @Middleware(rateLimiter)
  @Middleware(xTokenMiddleware)
  public async autenticaUsuario(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const email = req.headers["email"];
      const senha = req.headers["senha"];

      //Verifica se foi passado algum email , senha e ou código
      if (!email || !senha)
        return this.sendErrorResponse(res, {
          message: "Bad request",
          code: 400,
        });

      //Tenta autenticar o usuário
      const usuarioService = new UsuarioService();
      const resposta: IServiceResponse = await usuarioService.autentica(
        String(email),
        String(senha)
      );

      return res.status(resposta.code).send(resposta);
    } catch (err) {
      return this.sendErrorResponse(res, {
        message: `${err.message}`,
        code: 500,
      });
    }
  }

  //Loga usuário com o código
  @Get("login")
  @Middleware(rateLimiter)
  @Middleware(xTokenMiddleware)
  public async login(req: Request, res: Response): Promise<Response> {
    try {
      const email = req.headers["email"];
      const codigo = req.headers["codigo"];

      //Verifica se foi passado algum email e o codigo
      if (!codigo || !email)
        return this.sendErrorResponse(res, {
          message: "Parâmetros inválidos",
          code: 401,
        });

      //Verifica se o usuário existe.
      const usuarioService = new UsuarioService();
      const findedUser = await usuarioService.getUsuarioByEmail(String(email));
      if (!findedUser)
        return this.sendErrorResponse(res, {
          message: "Usuário não encontrado",
          code: 404,
        });

      ///Verifica código
      const codigoService = new CodigoService();
      const idCodigo = findedUser?.idCodigo;
      let codigoClass: Codigo | undefined;
      if (idCodigo) codigoClass = await codigoService.getCodigosById(idCodigo);

      if (codigoClass && codigo != codigoClass.codigoLogin)
        return this.sendErrorResponse(res, {
          message: "Código inválido.",
          code: 401,
        });

      const resposta = await usuarioService.login(findedUser);
      return res.status(resposta.code).send(resposta);
    } catch (err) {
      return this.sendErrorResponse(res, {
        message: `${err.message}`,
        code: 500,
      });
    }
  }

  //Refresh token passando token válido
  @Get("refresh")
  @Middleware(authMiddleware)
  public async refreshToken(req: Request, res: Response): Promise<Response> {
    try {
      const id = req.params.userId;

      //Verifica se o usuário existe.
      const usuarioService = new UsuarioService();
      const findedUser = await usuarioService.getUsuarioById(id);
      if (!findedUser)
        return this.sendErrorResponse(res, {
          message: "Usuário não existe.",
          code: 401,
        });

      //Cria token e retorna para cliente
      if (findedUser) {
        const token = AuthService.generateToken(findedUser.id);
        return res.status?.(200).send({
          code: 200,
          token: token,
        });
      } else {
        return this.sendErrorResponse(res, {
          message: "Erro no refresh",
          code: 500,
        });
      }
    } catch (err) {
      return this.sendErrorResponse(res, {
        message: `${err.message}`,
        code: 500,
      });
    }
  }

  @Get("me")
  @Middleware(authMiddleware)
  public async me(req: Request, res: Response): Promise<Response> {
    try {
      const id = req.params.userId;

      //Verifica se o usuário já existe.
      const usuarioService = new UsuarioService();
      const usuario = await usuarioService.getUsuarioById(id);
      if (!usuario)
        return this.sendErrorResponse(res, {
          message: "Usuário não existe.",
          code: 404,
        });

      return res.status(201).send({
        code: 200,
        usuario: {
          nome: usuario.nome,
          foto: usuario.foto,
          email: usuario.email,
          telefone: usuario.telefone,
          idEmpresa: usuario.idEmpresa,
        },
      });
    } catch (err) {
      return this.sendErrorResponse(res, {
        message: `${err.message}`,
        code: 500,
      });
    }
  }

  @Get("reset/password")
  @Middleware(rateLimiter)
  @Middleware(xTokenMiddleware)
  public async resetPassword(req: Request, res: Response): Promise<Response> {
    try {
      const email = req.headers["email"];
      //Verifica se o usuário não existe.
      const usuarioService = new UsuarioService();
      const usuario = await usuarioService.getUsuarioByEmail(String(email));
      if (!usuario)
        return this.sendErrorResponse(res, {
          message: "Usuário não existe.",
          code: 404,
        });

      //Recupera referência de códigos
      const codigoService = new CodigoService();
      const codigos: Codigo | undefined = await codigoService.getCodigosById(
        usuario.idCodigo
      );

      if (!codigos)
        return res.status(500).send({
          code: 500,
          message: "Não foi possível recuperar o código de ativação.",
        });

      //Atualiza o código de reset de senha
      const codigoResetPass: string = CodigoAtivacao.getRandomArbitrary(
        10000,
        99999
      ).toString();
      codigos.codigoResetPass = codigoResetPass;
      await codigoService.update({
        id: codigos.id,
        codigoAtivacao: codigos.codigoAtivacao,
        codigoLogin: codigos.codigoLogin,
        codigoResetPass: codigos.codigoResetPass,
      });

      //Cria token e retorna para cliente
      if (usuario) {
        const token = AuthService.generateTokenResetPass(usuario.id);
        return res.status(200).send({
          code: 200,
          message: "Códgio de reset de password criado com sucess!",
          token: token,
        });
      } else {
        return this.sendErrorResponse(res, {
          message: "Erro no reset de senha",
          code: 500,
        });
      }
    } catch (err) {
      return this.sendErrorResponse(res, {
        message: `${err.message}`,
        code: 500,
      });
    }
  }

  @Post("reset/password")
  @Middleware(rateLimiter)
  @Middleware(xTokenResetMiddleware) //Aqui também é usado o token de envio de email de rest de senha
  public async setNewPassword(req: Request, res: Response): Promise<Response> {
    try {
      const id = req.params.userId;

      //Verifica se o usuário já existe.
      const usuarioService = new UsuarioService();
      const usuario = await usuarioService.getUsuarioById(id);
      if (!usuario)
        return this.sendErrorResponse(res, {
          message: "Usuário não existe.",
          code: 404,
        });

      const { senha, confirmacao_senha, codigo } = req.body;

      //Valida dados de entrada
      /*eslint-disable @typescript-eslint/camelcase*/
      const schema = yup.object().shape({
        senha: yup.string().required(),
        confirmacao_senha: yup.string().required(),
        codigo: yup.string().required(),
      });
      try {
        await schema.validate(req.body, { abortEarly: false });
      } catch (error) {
        return this.sendErrorResponse(res, {
          message: "Parâmetros inválidos",
          code: 400,
        });
      }

      //Verifica se as duas senhas são iguais
      if (senha !== confirmacao_senha)
        return this.sendErrorResponse(res, {
          message: "Senha e confirmação não são iguais.",
          code: 401,
        });

      //Verifica se a senha é igual a anterior
      if (await AuthService.comparePasswords(senha, usuario.senha))
        return this.sendErrorResponse(res, {
          message: "A senha deve ser diferente das anteriores.",
          code: 401,
        });

      //Verificar código de segurança
      const codigoService = new CodigoService();
      const idCodigo = usuario?.idCodigo;
      let codigoClass: Codigo | undefined;
      if (idCodigo) codigoClass = await codigoService.getCodigosById(idCodigo);

      if (codigoClass && codigo != codigoClass.codigoResetPass)
        return this.sendErrorResponse(res, {
          message: "Código inválido.",
          code: 401,
        });

      //Remover código de segurança e atualiza senha
      const resposta = await usuarioService.resetSenha(usuario, senha);
      return res.status(resposta.code).send(resposta);
    } catch (err) {
      return this.sendErrorResponse(res, {
        message: `${err.message}`,
        code: 500,
      });
    }
  }
}
