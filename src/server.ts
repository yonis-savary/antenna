import Logger from "./logger";
import Router from "./router";
import { Config, ServiceConfig } from "./types/config-types";
import http from 'http';

export default class Server {
    private router: Router;
    private logger: Logger;

    constructor(configuration: Config) {
        this.router = new Router(configuration);
        this.logger = new Logger('server');
    }

    serve(port: number) {
        http.createServer(async (req, res) => {
            await this.router.route(req, res);

            this.logger.log(`${req.method} ${res.statusCode} ${req.url}`)
        })
        .listen(port, () => {
            let logger = new Logger('server');
            logger.log(`HTTP server running on http://localhost:${port}`);
        });

    }

}