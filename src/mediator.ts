import { ServiceConfig } from "./types/config-types";
import Logger from "./logger";
import CommandOutput from "./types/command-output";
import Process from "./process";

type MediatorService = { timeout: Timeout, name: string, service: ServiceConfig };
type Timeout = ReturnType<typeof setTimeout>;

export default class Mediator {

    private timeouts: Record<string, MediatorService> = {};
    private logger : Logger;

    constructor() {
        this.logger = new Logger('mediator');
    }

    private delayedLaunch(service: string, body: string) {
        if (!(service in this.timeouts)) {
            return this.logger.error("Error: could not launch service " + service)
        }
        const serviceConfig = this.timeouts[service];

        delete this.timeouts[service];

        this.launch(serviceConfig.name, serviceConfig.service, body)
    }

    private async launch(serviceName: string, service: ServiceConfig, body: string): Promise<CommandOutput[]> {
        const process = new Process(serviceName, service, body);
        return await process.launch();
    }

    async schedule(serviceName: string, service: ServiceConfig, body: string): Promise<CommandOutput[]> {
        if (serviceName in this.timeouts) {
            this.logger.log("Ignoring schedule for " + serviceName + " (timeout already existing)")
            return [];
        }

        if (!service.delay) {
            if (service.async) {
                this.logger.log("Executing " + serviceName + " (async)");
                this.launch(serviceName, service, body)
                    .catch(error => {throw new Error(error)})
                return [];
            }
            
            this.logger.log("Executing " + serviceName + " (no delay)");
            return await this.launch(serviceName, service, body)
                .catch(error => {throw new Error(error)})
        }
        else {
            this.timeouts[serviceName] = {
                timeout: setTimeout(
                    () => this.delayedLaunch(serviceName, body),
                    service.delay * 1000
                ),
                name: serviceName,
                service
            }
            this.logger.log("Executing " + serviceName + ` (delayed by ${service.delay} seconds)`);
            return [];
        }
    }
}