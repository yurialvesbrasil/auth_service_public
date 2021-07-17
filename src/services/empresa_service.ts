import { Empresa } from "@src/models/empresa_model";
import { EmpresaRepository } from "@src/repositories/empresa_repository";
import { ServiceInternalError } from "@src/util/errors/api-error";
import { List } from "lodash";
import { getCustomRepository, Repository } from "typeorm";

/*eslint-disable @typescript-eslint/interface-name-prefix*/
interface IEmpresa {
  nome: string;
  cnpj: string;
}

export class EmpresaService {
  private empresaRepository: Repository<Empresa>;

  constructor() {
    this.empresaRepository = getCustomRepository(EmpresaRepository);
  }

  public async getEmpresaById(id: string): Promise<Empresa | undefined> {
    try {
      const empresaExists = await this.empresaRepository.findOne({
        id,
      });
      return empresaExists;
    } catch (err) {
      throw new ServiceInternalError(`Erro : ${err.message}`);
    }
  }

  public async getListaEmpresas(): Promise<List<Empresa> | undefined> {
    try {
      const empresaList = await this.empresaRepository
        .createQueryBuilder("empresas")
        .getMany();

      return empresaList;
    } catch (err) {
      throw new ServiceInternalError(`Erro : ${err.message}`);
    }
  }
}
