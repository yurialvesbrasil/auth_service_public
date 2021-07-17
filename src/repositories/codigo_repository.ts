import { EntityRepository, Repository } from "typeorm";
import { Codigo } from "../models/codigo_model";

@EntityRepository(Codigo)
export class CodigoRepository extends Repository<Codigo> {}
