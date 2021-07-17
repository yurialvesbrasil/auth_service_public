import { EntityRepository, Repository } from "typeorm";
import { Empresa } from "../models/empresa_model";

@EntityRepository(Empresa)
export class EmpresaRepository extends Repository<Empresa> {}
