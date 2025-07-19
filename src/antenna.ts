// src/server.ts
import http from 'http';
import loadConfig from './config';
import Router from './router';
import dotenv from 'dotenv'
import Logger from './logger';

dotenv.config({ path: './.env' })

const PORT = process.env.APP_PORT ?? 3000;

const config = loadConfig();
const router = new Router(config);

http.createServer(async (req, res) => {
    router.route(req, res);
})
.listen(PORT, () => {
    let logger = new Logger('server');
    logger.log(`HTTP server running on http://localhost:${PORT}`);
});
