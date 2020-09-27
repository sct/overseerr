import express, { Request, Response, NextFunction } from 'express';
import next from 'next';
import path from 'path';
import { createConnection, getRepository } from 'typeorm';
import routes from './routes';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { TypeormStore } from 'connect-typeorm/out';
import YAML from 'yamljs';
import swaggerUi from 'swagger-ui-express';
import { OpenApiValidator } from 'express-openapi-validator';
import { Session } from './entity/Session';
import { getSettings } from './lib/settings';
import logger from './logger';

const API_SPEC_PATH = path.join(__dirname, 'overseerr-api.yml');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

createConnection();

app
  .prepare()
  .then(async () => {
    // Load Settings
    getSettings().load();

    const server = express();
    server.use(cookieParser());
    server.use(bodyParser.json());
    server.use(bodyParser.urlencoded({ extended: true }));

    // Setup sessions
    const sessionRespository = getRepository(Session);
    server.use(
      '/api',
      session({
        secret: 'verysecret',
        resave: false,
        saveUninitialized: false,
        cookie: {
          maxAge: 1000 * 60 * 60 * 24 * 30,
        },
        store: new TypeormStore({
          cleanupLimit: 2,
          ttl: 1000 * 60 * 60 * 24 * 30,
        }).connect(sessionRespository),
      })
    );
    const apiDocs = YAML.load(API_SPEC_PATH);
    server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(apiDocs));
    await new OpenApiValidator({
      apiSpec: API_SPEC_PATH,
      validateRequests: true,
      validateResponses: true,
    }).install(server);
    /**
     * This is a workaround to convert dates to strings before they are validated by
     * OpenAPI validator. Otherwise, they are treated as objects instead of strings
     * and response validation will fail
     */
    server.use((req, res, next) => {
      const original = res.json;
      res.json = function jsonp(json) {
        return original.call(this, JSON.parse(JSON.stringify(json)));
      };
      next();
    });
    server.use('/api/v1', routes);
    server.get('*', (req, res) => handle(req, res));
    server.use(
      (
        err: { status: number; message: string; errors: string[] },
        req: Request,
        res: Response,
        _next: NextFunction
      ) => {
        // format error
        res.status(err.status || 500).json({
          message: err.message,
          errors: err.errors,
        });
      }
    );

    const port = Number(process.env.PORT) || 3000;
    server.listen(port, (err) => {
      if (err) {
        throw err;
      }
      logger.info(`Server ready on port ${port}`, {
        label: 'SERVER',
      });
    });
  })
  .catch((err) => {
    logger.error(err.stack);
    process.exit(1);
  });
