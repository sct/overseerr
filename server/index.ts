import express from 'express';
import next from 'next';
import { createConnection } from 'typeorm';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

createConnection();

app
  .prepare()
  .then(() => {
    const server = express();
    server.get('/api', (req, res) => {
      res.json({ worked: true });
    });
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
