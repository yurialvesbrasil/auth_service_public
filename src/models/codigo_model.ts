/*eslint-disable @typescript-eslint/no-inferrable-types*/
import { Entity, Column, PrimaryColumn } from "typeorm";
import { v4 as uuid } from "uuid";

@Entity("codigos")
export class Codigo {
  @PrimaryColumn()
  readonly id: string = "d961a846-8c28-43c7-803f-9b9ebaa2b6ac";

  @Column({ name: "codigo_ativacao" })
  codigoAtivacao: string = "";

  @Column({ name: "codigo_login" })
  codigoLogin: string = "";

  @Column({ name: "codigo_reset_pass" })
  codigoResetPass: string = "";

  constructor() {
    if (this.id == "d961a846-8c28-43c7-803f-9b9ebaa2b6ac") {
      this.id = uuid();
    }
  }
}
