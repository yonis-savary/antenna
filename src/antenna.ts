// src/server.ts
import loadConfig from './config';
import dotenv from 'dotenv'
import Server from './server';

dotenv.config({ path: './.env' })

const server = new Server(loadConfig());

server.serve((process.env.APP_PORT ?? 3000) as number)