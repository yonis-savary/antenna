import Logger from "./logger";
import Router from "./router";
import { Config, ServiceConfig } from "./types/config-types";
import http from 'http';

export default class Server {
    private router: Router;

    constructor(configuration: Config) {
        this.router = new Router(configuration);
    }

    serve(port: number) {
        http.createServer(async (req, res) => {
            this.router.route(req, res);
        })
        .listen(port, () => {
            let logger = new Logger('server');
            logger.log(`HTTP server running on http://localhost:${port}`);
        });

    }

}