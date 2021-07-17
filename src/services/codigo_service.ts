import { Codigo } from "@src/models/codigo_model";
import { CodigoRepository } from "@src/repositories/codigo_repository";
import { ServiceInternalError } from "@src/util/errors/api-error";
import { getCustomRepository, Repository } from "typeorm";

/*eslint-disable @typescript-eslint/interface-name-prefix*/
interface ICodigo {
  id: string;
  codigoAtivacao?: string;
  codigoLogin?: string;
  codigoResetPass?: string;
}

export class CodigoService {
  private codigoRepository: Repository<Codigo>;
  constructor() {
    this.codigoRepository = getCustomRepository(CodigoRepository);
  }

  //Salva codigos no banco de dados
  async create(codigo: ICodigo): Promise<Codigo> {
    try {
      const { codigoAtivacao, codigoLogin, codigoResetPass } = codigo;

      const newCodigo: Codigo = this.codigoRepository.create({
        codigoAtivacao,
        codigoLogin,
        codigoResetPass,
      });

      return await this.codigoRepository.save<Codigo>(newCodigo);
    } catch (err) {
      throw new ServiceInternalError(
        `Erro na salvamento do código: ${err.message}`
      );
    }
  }

  //Recupera os códigos do usuário
  async getCodigosById(idCodigo: string): Promise<Codigo | undefined> {
    try {
      const codigoExists = await this.codigoRepository.findOne({
        id: idCodigo,
      });

      return codigoExists;
    } catch (err) {
      throw new ServiceInternalError(
        `Erro na recuperação dos códigos do usuário por email: ${err.message}`
      );
    }
  }

  //Update codigos no banco de dados
  async update(codigo: ICodigo): Promise<void> {
    try {
      await this.codigoRepository.update(codigo.id, codigo);
    } catch (err) {
      throw new ServiceInternalError(
        `Erro na atualização de código: ${err.message}`
      );
    }
  }
}
