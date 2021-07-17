/*eslint-disable @typescript-eslint/no-inferrable-types*/
import { Entity, Column, PrimaryColumn, CreateDateColumn } from "typeorm";
import { v4 as uuid } from "uuid";

@Entity("empresas")
class Empresa {
  @PrimaryColumn()
  readonly id: string = "d961a846-8c28-43c7-803f-9b9ebaa2b6ac";

  @Column()
  nome: string = "";

  @Column()
  cnpj: string = "";

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date = new Date();

  constructor() {
    if (this.id == "d961a846-8c28-43c7-803f-9b9ebaa2b6ac") {
      this.id = uuid();
    }
  }
}

export { Empresa };
