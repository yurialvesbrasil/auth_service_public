import { Connection, createConnection, getConnectionOptions } from "typeorm";
import config from "config";

export const connect = async (): Promise<Connection> => {
  const defaultOptions = await getConnectionOptions();
  //const dbConfig: IConfig = config.get('App.database');
  //const dirConfig: IConfig = config.get('App.diretorios');

  return await createConnection(
    Object.assign(defaultOptions, {
      type: config.get("App.database.type"),
      database: config.get("App.database.database"),
      host: config.get("App.database.db_host"),
      port: config.get("App.database.db_port"),
      username: config.get("App.database.db_username"),
      password: config.get("App.database.db_password"),
      entities: config.get("App.diretorios.entities"),
      migrations: config.get("App.diretorios.migrations"),
      seeds: config.get("App.diretorios.seeds"),
    })
  );
};
