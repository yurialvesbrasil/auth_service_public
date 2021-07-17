import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import { Empresa } from '../../models/empresa_model';

export default class CreateEmpresas implements Seeder {
  /*eslint-disable @typescript-eslint/no-explicit-any*/
  public async run(factory: Factory, connection: Connection): Promise<any> {
    await connection
      .createQueryBuilder()
      .insert()
      .into(Empresa)
      .onConflict(`("id") DO NOTHING`)
      .values([
        {
          id: '26db26f7-665c-4fbc-8f7b-50613861882b',
          nome: 'Restaurante',
          cnpj: '05059613000118',
        },
        {
          id: '515b8f7a-7971-4383-9b1a-192e75003530',
          nome: 'Sushi',
          cnpj: '06990590000123',
        },
      ])
      .execute();
  }
}
