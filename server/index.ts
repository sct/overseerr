import express from 'express';
import next from 'next';
import { createConnection, getRepository } from 'typeorm';
import routes from './routes';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { TypeormStore } from 'connect-typeorm/out';
import { Session } from './entity/Session';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

createConnection();

app
  .prepare()
  .then(() => {
    const server = express();
    server.use(cookieParser());
    server.use(bodyParser.json());
    server.use(bodyParser.urlencoded({ extended: true }));

    // Setup sessions
    const sessionRespository = getRepository(Session);
    server.use(
      session({
        secret: 'verysecret',
        resave: false,
        saveUninitialized: false,
        store: new TypeormStore({
          cleanupLimit: 2,
          ttl: 86400,
        }).connect(sessionRespository),
      })
    );
    server.use('/api', routes);
    server.get('*', (req, res) => handle(req, res));

    const port = Number(process.env.PORT) || 3000;
    server.listen(port, (err) => {
      if (err) {
        throw err;
      }
      console.log(`Ready to do stuff http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error(err.stack);
    process.exit(1);
  });
