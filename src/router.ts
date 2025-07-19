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

        if (!await hasJsonBody(request, response))
            return;

        const service = this.routes[request.url ?? ''];

        if (!service) {
            response.writeHead(404);
            response.end();
            return;
        }

        if (!await sha256ChecksOut(request, response, service.service)) 
            return;

        this.mediator.schedule(service.name, service.service);

        response.setHeader('Content-Type', 'application/json');
        response.writeHead(204);
        response.end();
    }
}