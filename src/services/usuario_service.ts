import { getCustomRepository, Repository } from "typeorm";
import { Usuario } from "@src/models/usuario_model";
import { UsuarioRepository } from "@src/repositories/usuario_repository";
import AuthService from "./auth_service";
import { CodigoAtivacao } from "@src/util/codigo-ativacao";
import { IServiceResponse } from "@src/util/payload/response";
import logger from "@src/logger";
import { resolve } from "path";
import { SendEmailService } from "./send_email_service";
import config from "config";
import { ServiceInternalError } from "@src/util/errors/api-error";
import { Codigo } from "@src/models/codigo_model";
import { CodigoRepository } from "@src/repositories/codigo_repository";
import { CodigoService } from "./codigo_service";

/*eslint-disable @typescript-eslint/interface-name-prefix*/
interface IUsuario {
  nome: string;
  telefone: string;
  email: string;
  senha: string;
  idEmpresa: string;
  foto?: string;
}

export class UsuarioService {
  private usuarioRepository: Repository<Usuario>;
  private codigoRepository: Repository<Codigo>;
  constructor() {
    this.usuarioRepository = getCustomRepository(UsuarioRepository);
    this.codigoRepository = getCustomRepository(CodigoRepository);
  }

  //Salva usuario no banco de dados
  async create(usuario: IUsuario): Promise<Usuario> {
    try {
      const { nome, telefone, email, senha, idEmpresa, foto } = usuario;
      const hashedPassword = await AuthService.hashPassword(senha);
      const codigoAtivacao: string = CodigoAtivacao.getRandomArbitrary(
        10000,
        99999
      ).toString();

      //Cria código de ativação
      const codigo: Codigo = new Codigo();
      codigo.codigoAtivacao = codigoAtivacao;

      const newCodigo = await this.codigoRepository.save<Codigo>(codigo);

      //Cria usuário
      const user: Usuario = this.usuarioRepository.create({
        nome,
        telefone,
        email,
        senha: hashedPassword,
        idEmpresa,
        foto,
        codigo: newCodigo,
      });

      await this.usuarioRepository.save<Usuario>(user);

      return user;
    } catch (err) {
      throw new ServiceInternalError(
        `Erro na criação do usuário: ${err.message}`
      );
    }
  }

  //Autentica email e senha do usuário e envia toquen para senha de dois fatores
  async autentica(email: string, senha: string): Promise<IServiceResponse> {
    try {
      const usuarioService = new UsuarioService();
      const usuario: Usuario | undefined =
        await usuarioService.getUsuarioByEmail(email);

      if (!usuario) return { code: 404, message: "Usuário não encontrado!" };

      const codigoService = new CodigoService();
      const codigoUser: Codigo | undefined = await codigoService.getCodigosById(
        usuario.idCodigo
      );

      if (!codigoUser)
        return { code: 500, message: "Dados do usuário está corrompido!" };

      //Verifica se a conta está ativada
      if (
        codigoUser &&
        codigoUser.codigoAtivacao &&
        codigoUser.codigoAtivacao != ""
      )
        return { code: 203, message: "Conta do usuário não está ativada." };

      //Falha de senha
      if (
        usuario.senha &&
        !(await AuthService.comparePasswords(senha, usuario.senha))
      )
        return { code: 401, message: "Email e/ou senha errada!" };

      //Cria token
      const token = AuthService.generateTokenAuthenticated(usuario.id);

      return {
        code: 200,
        message: "Autenticação efetuado com sucesso!",
        token: token,
      };
    } catch (err) {
      throw new ServiceInternalError(
        `Erro no login do usuário: ${err.message}`
      );
    }
  }

  //Ativa conta do usuário
  async ativa(user: Usuario): Promise<IServiceResponse> {
    try {
      const usuarioService = new UsuarioService();
      const usuario: Usuario | undefined =
        await usuarioService.getUsuarioByEmail(user.email);

      if (!usuario)
        return {
          code: 404,
          message: "Não foi possível verificar o código.",
        };

      const codigoService = new CodigoService();
      const codigoUsuario: Codigo | undefined =
        await codigoService.getCodigosById(user.idCodigo);

      //Atualiza codigo de usuário
      if (codigoUsuario) {
        codigoUsuario.codigoAtivacao = "";
        await this.codigoRepository.update(usuario.idCodigo, codigoUsuario);
        //Cria token para uso da api
        const token = AuthService.generateToken(user.id);

        return {
          code: 201,
          message: "Conta de usuário ativada com sucesso.",
          token: token,
        };
      }

      throw new ServiceInternalError(`Não foi possível verificar o código.`);
    } catch (err) {
      throw new ServiceInternalError(
        `Erro na ativação do usuário: ${err.message}`
      );
    }
  }

  //resetSenha
  async resetSenha(user: Usuario, senha: string): Promise<IServiceResponse> {
    try {
      //Cria proteção de senha
      const hashedPassword = await AuthService.hashPassword(senha);

      //Altera senha
      await this.usuarioRepository
        .createQueryBuilder()
        .update(Usuario)
        .set({ senha: hashedPassword })
        .where("id = :id", { id: user.id })
        .execute();
    } catch (err) {
      throw new ServiceInternalError(`Erro : ${err.message}`);
    }

    try {
      //Limpa código de resetSenha
      const codigoService = new CodigoService();
      const codigoUsuario: Codigo | undefined =
        await codigoService.getCodigosById(user.idCodigo);
      if (codigoUsuario)
        codigoService.update({
          id: codigoUsuario.id,
          codigoAtivacao: "",
          codigoLogin: "",
          codigoResetPass: "",
        });
    } catch (err) {
      logger.error(
        `Erro ao tentar limpar código de reset de senha: ${err.message}`
      );
    }

    return {
      code: 201,
      message: "Senha do usuário alterada com sucesso!",
    };
  }

  //Loga usuário no sistema
  async login(user: Usuario): Promise<IServiceResponse> {
    try {
      //Limpa código de login
      const codigoService = new CodigoService();
      const codigoUsuario: Codigo | undefined =
        await codigoService.getCodigosById(user.idCodigo);
      if (codigoUsuario)
        codigoService.update({
          id: codigoUsuario.id,
          codigoAtivacao: codigoUsuario.codigoAtivacao,
          codigoLogin: "",
        });

      //Cria token para uso da api e retorna para cliente
      const token = AuthService.generateToken(user.id);

      return {
        code: 200,
        message: "Usuário logado com sucesso.",
        token: token,
      };
    } catch (err) {
      throw new ServiceInternalError(`Erro : ${err.message}`);
    }
  }

  //Recupera usuário por email
  async getUsuarioByEmail(email: string): Promise<Usuario | undefined> {
    try {
      const usuarioExists = await this.usuarioRepository.findOne({
        email,
      });

      return usuarioExists;
    } catch (err) {
      throw new ServiceInternalError(
        `Erro na recuperação do usuário por email: ${err.message}`
      );
    }
  }

  //Recupera usuário por id
  async getUsuarioById(id: string): Promise<Usuario | undefined> {
    try {
      const usuarioExists = await this.usuarioRepository.findOne({
        id,
      });

      return usuarioExists;
    } catch (err) {
      throw new ServiceInternalError(
        `Erro na recuperação do usuário por email: ${err.message}`
      );
    }
  }

  //Esta função é responssável por criar um novo código e enviar por email.
  async sendEmailAtivacao(user: Usuario): Promise<IServiceResponse> {
    try {
      const usuarioService = new UsuarioService();
      const usuario: Usuario | undefined =
        await usuarioService.getUsuarioByEmail(user.email);

      if (!usuario)
        return {
          code: 500,
          message: "Não foi possível recuperar o código de ativação.",
        };

      const codigoService = new CodigoService();
      const codigos: Codigo | undefined = await codigoService.getCodigosById(
        usuario.idCodigo
      );

      if (!codigos)
        return {
          code: 500,
          message: "Não foi possível recuperar o código de ativação.",
        };

      const npsPathAtivacao = resolve(
        __dirname,
        config.get("App.path_ativacao.nivel1"),
        config.get("App.path_ativacao.nivel2"),
        config.get("App.path_ativacao.nivel3"),
        config.get("App.path_ativacao.nivel4"),
        config.get("App.path_ativacao.nivel5")
      );

      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
      const yyyy = today.getFullYear();

      const data = mm + "/" + dd + "/" + yyyy;

      //Atualiza o código de ativação e envia por email
      const codigoAtivacao: string = CodigoAtivacao.getRandomArbitrary(
        10000,
        99999
      ).toString();
      codigos.codigoAtivacao = codigoAtivacao;
      await codigoService.update({
        id: codigos.id,
        codigoAtivacao: codigos.codigoAtivacao,
        codigoLogin: codigos.codigoLogin,
      });

      const variables = {
        codigo: codigoAtivacao,
        title: "Obrigado por se cadastrar.",
        subtitulo: "Confirme seu e-mail para ter acesso total ao sistema.",
        empresaNome: "PERFIL SERVICE",
        data: data,
      };

      const sendEmailService = new SendEmailService();
      const resultado: IServiceResponse = await sendEmailService.execute(
        user.email,
        "Confirme o seu email.",
        variables,
        npsPathAtivacao
      );

      logger.info(`${resultado}`);

      return resultado;
    } catch (err) {
      throw new ServiceInternalError(`Erro no envio do email: ${err.message}`);
    }
  }

  //Esta função é responssável por criar um novo código e enviar por email.
  async sendEmailCodigoLogin(user: Usuario): Promise<IServiceResponse> {
    try {
      const usuarioService = new UsuarioService();
      const usuario: Usuario | undefined =
        await usuarioService.getUsuarioByEmail(user.email);

      if (!usuario)
        return {
          code: 500,
          message: "Não foi possível recuperar o código de login.",
        };

      const codigoService = new CodigoService();
      const codigos: Codigo | undefined = await codigoService.getCodigosById(
        usuario.idCodigo
      );

      if (!codigos)
        return {
          code: 500,
          message: "Não foi possível recuperar o código de login.",
        };

      const npsPathAtivacao = resolve(
        __dirname,
        config.get("App.path_ativacao.nivel1"),
        config.get("App.path_ativacao.nivel2"),
        config.get("App.path_ativacao.nivel3"),
        config.get("App.path_ativacao.nivel4"),
        config.get("App.path_ativacao.nivel5")
      );

      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
      const yyyy = today.getFullYear();

      const data = mm + "/" + dd + "/" + yyyy;

      //Cria um código novo de login e envia para usuário
      const codigoLogin: string = CodigoAtivacao.getRandomArbitrary(
        10000,
        99999
      ).toString();

      //Atualiza novo código de login no banco de dados
      await codigoService.update({
        id: codigos.id,
        codigoAtivacao: codigos.codigoAtivacao,
        codigoLogin: codigoLogin,
      });

      const variables = {
        codigo: codigoLogin,
        title: "Código de login.",
        subtitulo: "Use o código abaixo para efetuar o login.",
        empresaNome: "PERFIL SERVICE",
        data: data,
      };

      const sendEmailService = new SendEmailService();
      const resultado: IServiceResponse = await sendEmailService.execute(
        user.email,
        "Confirme sua identidade.",
        variables,
        npsPathAtivacao
      );

      logger.info(`${resultado}`);

      return resultado;
    } catch (err) {
      throw new ServiceInternalError(
        `Erro no envio do email e ou criação do código de login: ${err.message}`
      );
    }
  }

  //Esta função é responssável por criar um novo código de reset de password e enviar por email.
  async sendEmailCodigoResetPass(user: Usuario): Promise<IServiceResponse> {
    try {
      const usuarioService = new UsuarioService();
      const usuario: Usuario | undefined =
        await usuarioService.getUsuarioByEmail(user.email);

      if (!usuario)
        return {
          code: 500,
          message: "Não foi possível recuperar o código de login.",
        };

      const codigoService = new CodigoService();
      const codigos: Codigo | undefined = await codigoService.getCodigosById(
        usuario.idCodigo
      );

      if (!codigos)
        return {
          code: 500,
          message: "Não foi possível recuperar o código de reset de password.",
        };

      const npsPathAtivacao = resolve(
        __dirname,
        config.get("App.path_ativacao.nivel1"),
        config.get("App.path_ativacao.nivel2"),
        config.get("App.path_ativacao.nivel3"),
        config.get("App.path_ativacao.nivel4"),
        config.get("App.path_ativacao.nivel5")
      );

      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
      const yyyy = today.getFullYear();

      const data = mm + "/" + dd + "/" + yyyy;

      //Cria um código novo de reset de password e envia para usuário
      const codigoReset: string = CodigoAtivacao.getRandomArbitrary(
        10000,
        99999
      ).toString();

      //Atualiza novo código de login no banco de dados
      await codigoService.update({
        id: codigos.id,
        codigoAtivacao: codigos.codigoAtivacao,
        codigoLogin: codigos.codigoAtivacao,
        codigoResetPass: codigoReset,
      });

      const variables = {
        codigo: codigoReset,
        title: "Código de reset de password.",
        subtitulo: "Use o código abaixo para efetuar a alteração da senha.",
        empresaNome: "PERFIL SERVICE",
        data: data,
      };

      const sendEmailService = new SendEmailService();
      const resultado: IServiceResponse = await sendEmailService.execute(
        user.email,
        "Confirme sua identidade.",
        variables,
        npsPathAtivacao
      );

      logger.info(`${resultado}`);

      return resultado;
    } catch (err) {
      throw new ServiceInternalError(
        `Erro no envio do email e ou criação do código de reset de password: ${err.message}`
      );
    }
  }
}
