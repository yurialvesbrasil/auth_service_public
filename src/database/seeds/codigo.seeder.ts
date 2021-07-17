import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import { Codigo } from '../../models/codigo_model';

export default class CreateCodigos implements Seeder {
  /*eslint-disable @typescript-eslint/no-explicit-any*/
  public async run(factory: Factory, connection: Connection): Promise<any> {
    await connection
      .createQueryBuilder()
      .insert()
      .into(Codigo)
      .values([
        {
          id: 'd505fdac-f700-4a7c-9b2a-4d7591102964',
          codigoAtivacao: '',
          codigoLogin: '',
          codigoResetPass: ''
        },
      ])
      .execute();
  }
}
