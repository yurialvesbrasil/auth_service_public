import './util/module-alias';
import { Application } from 'express';
import { Server } from '@overnightjs/core';
import bodyParser from 'body-parser';
import * as http from 'http';
import expressPino from 'express-pino-logger';
import swaggerUi from 'swagger-ui-express';
import { OpenApiValidator } from 'express-openapi-validator';
import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';
import logger from './logger';
import apiSchema from './api-schema.json';
import helmet from 'helmet';
import compression from 'compression';
import * as database from '@src/database';
import { PortaConfig } from './util/porta-conf';
import cors from 'cors';
import { UsersController } from './controllers/usuario_controller';
import { EmpresasController } from './controllers/empresa_controller';
import { EmailController } from './controllers/email_controller';
import { apiErrorValidator } from './middlewares/api-error-validator';
import expressDefend from 'express-defend';
import ipBlacklist from 'ip-blacklist';
import path from 'path';
import config from 'config';
import { ListaNegra } from './util/lista-negra';
import fs from 'fs';

class SetupServer extends Server {
  private server?: http.Server;
  
  // Aqui a porta tem que ser fixa por causa do heroku
  private port = PortaConfig.normalizePort(process.env.PORT ||  config.get('App.port'));

  public async init(): Promise<void> {
    this.setupSecurity();
    this.setupExpress();
    await this.docsSetup();
    this.setupControllers();
    await this.databaseSetup();
    //must be the last
    this.setupErrorHandlers();
  }

  private setupSecurity(): void {
    const blacklist: string[] = ListaNegra.getListaIps();
    this.app.use(
      cors({
        origin: '*',
      })
    );
    this.app.use(helmet());
    this.app.disable('x-powered-by');
    this.app.use(
      ipBlacklist(
        ipBlacklist.chain(
          ipBlacklist.file(
            path.join(
              __dirname,
              config.get('App.path_black_list.nivel1'),
              config.get('App.path_black_list.nivel2')
            )
          )
        )
      )
    );
    this.app.use(
      expressDefend.protect({
        maxAttempts: 5,
        dropSuspiciousRequest: true,
        logFile: 'suspicious.log',
        onMaxAttemptsReached: function (ipAddress: string, url: string) {
          logger.info(`URL bloqueada: ${url}`);
          ipBlacklist.push(ipAddress);
        },
      })
    );
    this.app.use(
      ipBlacklist((ip) => {
        return blacklist.indexOf(ip) !== -1;
      })
    );
    //Cria log de acessos
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('express-file-logger')(this.app);
    
  }

  private setupExpress(): void {
    this.app.use(compression());
    this.app.use(bodyParser.json({ limit: '50mb' }));
    this.app.use(
      expressPino({
        logger,
      })
    );
  }

  private async docsSetup(): Promise<void> {
    this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(apiSchema));
    await new OpenApiValidator({
      apiSpec: apiSchema as OpenAPIV3.Document,
      validateRequests: false, //we do it
      validateResponses: false,
    }).install(this.app);
  }

  private setupControllers(): void {
    const usersController = new UsersController();
    const empresasController = new EmpresasController();
    const emailController = new EmailController();
    this.addControllers([usersController]);
    this.addControllers([empresasController]);
    this.addControllers([emailController]);
  }

  private setupErrorHandlers(): void {
    this.app.use(apiErrorValidator);
  }

  public getApp(): Application {
    return this.app;
  }

  private async databaseSetup(): Promise<void> {
    await database.connect();
  }

  public start(): void {
    this.server = this.app.listen(this.port, () => {
      logger.info('Server listening on port: ' + this.port);
      console.log('Server listening on port: ' + this.port);
    });
  }
}

export { SetupServer };
