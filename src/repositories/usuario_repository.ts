import { EntityRepository, Repository } from "typeorm";
import { Usuario } from "../models/usuario_model";

@EntityRepository(Usuario)
export class UsuarioRepository extends Repository<Usuario> {}
