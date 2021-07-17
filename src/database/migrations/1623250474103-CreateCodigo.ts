import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateCodigo1623250474103 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'codigos',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'codigo_ativacao',
            type: 'varchar',
          },
          {
            name: 'codigo_login',
            type: 'varchar',
          },
          {
            name: 'codigo_reset_pass',
            type: 'varchar',
          }
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('codigos');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('id_usuario') !== -1
    );
    if (foreignKey) await queryRunner.dropForeignKey('codigos', foreignKey);
    await queryRunner.dropColumn('codigos', 'id_usuario');
    await queryRunner.dropTable('codigos');
  }
}
