import { IncomingMessage, ServerResponse } from "http";
import { Config, ServiceConfig } from "./types/config-types";
import Mediator from "./mediator";
import sha256ChecksOut from "./middlewares/sha256ChecksOut";
import hasJsonBody from "./middlewares/hasJsonBody";
import { getRequestBody } from "./utils";
import Logger from "./logger";

type RouterService = {
    name: string,
    callback: (request: RouterRequest, response: ServerResponse<IncomingMessage>, service: RouterService) => void,  
    service?: ServiceConfig|null
};
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

        if (process.env.ALLOW_PING_ROUTE ?? true)
        {
            this.routes['/ping'] = {name: 'ping', service: null, callback: (req, res)=>{
                res.setHeader('Content-Type', 'text/plain')
                res.writeHead(200);
                res.write('pong');
                res.end();
            }}
        }

        for (const [label, service] of entries)
        {
            this.logger.log(" - Adding service " + label);

            if (service.url in this.routes) {
                this.logger.warn(`WARNING: ${label} url is overriding ${this.routes[service.url].service} service url`);
            }
            this.routes[service.url] = { name: label, service: service, callback: this.handleService.bind(this) };
        }

    }

    async handleService(request: RouterRequest, response: ServerResponse<IncomingMessage>, service: RouterService)
    {
        if (!service.service)
        {
            console.log("Error, badly configurer service/router ", service);
            response.writeHead(500);
            response.end();
            return;
        }

        if (service.service.secret)
        {
            if (!await hasJsonBody(request, response)) {
                response.writeHead(415);
                response.write('Please use a POST request with json body/header');
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
            const result = await this.mediator.schedule(service.name, service.service, request.body);
            if (result) {
                response.setHeader('content-type', 'application/json');
                response.writeHead(200);
                response.write(JSON.stringify({status: 'ok', message: 'task successfuly executed', data: result}))
                response.end();
            } else {
                response.setHeader('content-type', 'application/json');
                response.writeHead(200);
                response.write(JSON.stringify({status: 'ok', message: 'task scheduled (or already scheduled)'}))
                response.end();
            }
        }
        catch (error) {
            const logger = new Logger('server-error')
            logger.error('Got server error ' + error);
            logger.error(JSON.stringify({status: 'error', message: String(error)}))

            response.setHeader('content-type', 'application/json');
            response.writeHead(500);
            response.write(JSON.stringify({status: 'error', message: 'Server Error'}))
            response.end();
        }

    }

    async route(request: RouterRequest, response: ServerResponse<IncomingMessage>) {
        request.body = await getRequestBody(request);

        const service = this.routes[request.url ?? ''];

        if (!service) {
            response.writeHead(404);
            response.end();
            return;
        }

        await service.callback(request, response, service);
    }
}