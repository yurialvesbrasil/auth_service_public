/*eslint-disable @typescript-eslint/no-inferrable-types*/
import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { v4 as uuid } from "uuid";
import { Codigo } from "./codigo_model";
import { Empresa } from "./empresa_model";

@Entity("usuarios")
export class Usuario {
  @PrimaryColumn()
  readonly id: string = "d961a846-8c28-43c7-803f-9b9ebaa2b6ac";

  @Column()
  foto: string = "";

  @Column()
  nome: string = "";

  @Column()
  telefone: string = "";

  @Column()
  email: string = "";

  @Column({ type: "varchar", length: 100, nullable: false })
  senha: string = "";

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date = new Date();

  @UpdateDateColumn({ name: "update_at" })
  updatedAt: Date = new Date();

  @Column({ name: "id_empresa" })
  idEmpresa: string = "d961a846-8c28-43c7-803f-9b9ebaa2b6ac";

  @Column({ name: "id_codigo" })
  idCodigo: string = "d961a846-8c28-43c7-803f-9b9ebaa2b6ac";

  @OneToOne(() => Empresa)
  @JoinColumn({ name: "id_empresa" })
  empresa: Empresa = new Empresa();

  @OneToOne(() => Codigo)
  @JoinColumn({ name: "id_codigo" })
  codigo: Codigo = new Codigo();

  constructor() {
    if (this.id == "d961a846-8c28-43c7-803f-9b9ebaa2b6ac") {
      this.id = uuid();
    }
  }
}
