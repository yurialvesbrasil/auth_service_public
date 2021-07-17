import pino from 'pino';
import config from 'config';
import path from 'path';


export default pino({
  enabled: config.get('App.logger.enabled'),
  level: config.get('App.logger.level'),
  prettyPrint: {
    levelFirst: true,
    colorize: true,
  }
},
  pino.destination(path.join(
    __dirname,
    config.get('App.path_logger.nivel1'),
    config.get('App.path_logger.nivel2')
  ))
);
