import { IncomingMessage, ServerResponse } from "http";
import { Config, ServiceConfig } from "./types/config-types";
import Mediator from "./mediator";
import sha256ChecksOut from "./middlewares/sha256ChecksOut";
import hasJsonBody from "./middlewares/hasJsonBody";
import { getRequestBody } from "./utils";
import Logger from "./logger";

type RouterService = { name: string, service: ServiceConfig };
export type RouterRequest = IncomingMessage & { body?: any }

export default class Router {
    private routes: Record<string,RouterService> = {}
    private mediator: Mediator;
    private logger: Logger;

    constructor(configuration: Config) {
        this.logger = new Logger('router');

        this.logger.log("Configuring router...");

        this.mediator = new Mediator();
        this.routes = {}

        const entries = Object.entries(configuration);

        for (const [label, service] of entries)
        {
            this.logger.log(" - Adding service " + label);

            if (service.url in this.routes) {
                this.logger.warn(`WARNING: ${label} url is overriding ${this.routes[service.url].service} service url`);
            }
            this.routes[service.url] = { name: label, service: service};
        }
    }

    async route(request: RouterRequest, response: ServerResponse<IncomingMessage>) {
        request.body = await getRequestBody(request);

        this.logger.log(`${request.method} ${request.url}`)


        const service = this.routes[request.url ?? ''];

        if (!service) {
            response.writeHead(404);
            response.end();
            return;
        }


        if (service.service.secret)
        {
            if (!await hasJsonBody(request, response)) {
                response.writeHead(415);
                response.end();
                return;
            }
    
            if (!await sha256ChecksOut(request, response, service.name, service.service)) {
                response.setHeader('content-type', 'application/json');
                response.writeHead(401);
                response.write(JSON.stringify({status: 'error', message: 'invalid/missing signature'}))
                response.end();
                return;
            }
        }

        try {
            const result = await this.mediator.schedule(service.name, service.service);
            if (result) {
                response.setHeader('content-type', 'application/json');
                response.writeHead(200);
                response.write(JSON.stringify({status: 'ok', message: 'task successfuly executed'}))
                response.end();
            } else {
                response.setHeader('content-type', 'application/json');
                response.writeHead(200);
                response.write(JSON.stringify({status: 'ok', message: 'task scheduled (or already scheduled)'}))
                response.end();
            }
        }
        catch (error) {
            response.setHeader('content-type', 'application/json');
            response.writeHead(500);
            response.write(JSON.stringify({status: 'error', message: error}))
            response.end();
        }

    }
}