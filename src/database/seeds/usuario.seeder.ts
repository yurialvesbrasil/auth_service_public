import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import { Usuario } from '../../models/usuario_model';

export default class CreateUsuarios implements Seeder {
  /*eslint-disable @typescript-eslint/no-explicit-any*/
  public async run(factory: Factory, connection: Connection): Promise<any> {
    await connection
      .createQueryBuilder()
      .insert()
      .into(Usuario)
      .values([
        {
          id: '5897c129-7226-4ffb-9305-5988cfdfe1c5',
          nome: 'Yuri Brasil',
          telefone: '91984018574',
          email: 'yurihotmail@hotmail.com',
          senha: '$2b$10$75kd0jjTq7.x.KL3lE1ETOLG52rdUNJjWYhwU6MFalX/0UtpJyR9G',
          createdAt: '2021-04-28 13:35:39 +0000',
          updatedAt: '2021-04-28 13:35:39 +0000',
          idEmpresa: '26db26f7-665c-4fbc-8f7b-50613861882b',
          idCodigo: 'd505fdac-f700-4a7c-9b2a-4d7591102964',
        },
      ])
      .execute();
  }
}
