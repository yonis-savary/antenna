import { exec } from "child_process";
import { ServiceConfig } from "./types/config-types";
import Logger from "./logger";

type MediatorService = { timeout: Timeout, name: string, service: ServiceConfig };
type Timeout = ReturnType<typeof setTimeout>;

export default class Mediator {

    private timeouts: Record<string, MediatorService> = {};
    private logger : Logger;

    constructor() {
        this.logger = new Logger('mediator');
    }

    private delayedLaunch(service: string) {
        if (!(service in this.timeouts)) {
            return this.logger.error("Error: could not launch service " + service)
        }
        const serviceConfig = this.timeouts[service];

        delete this.timeouts[service];

        this.launch(serviceConfig.name, serviceConfig.service)
    }

    private async launch(serviceName: string, service: ServiceConfig) {
        let processLogger = new Logger(serviceName);

        processLogger.log(`Launching service ${serviceName}`)
        for (const command of service.commands) {
            processLogger.log(`> ${command}`);
            await new Promise((resolve, reject) => {
                exec(command, { cwd: service.directory }, (error, stdout, stderr) => {
                    if (stderr) {
                        stderr.trim().split("\n").forEach(line => processLogger.error(`stderr: ${line}`));
                    }
                    if (stdout) {
                        stdout.trim().split("\n").forEach(line => processLogger.log(`stdout: ${line}`));
                    }
                    if (!(error || stderr || stdout)) {
                        processLogger.log(`No output`);
                    }

                    if (error) {
                        error.message.trim().split("\n").forEach(line => processLogger.log(`error: ${line}`));
                        return reject(error.message);
                    }

                    resolve(stdout)
                })
            })
        }
    }

    async schedule(serviceName: string, service: ServiceConfig): Promise<true|null> {
        if (serviceName in this.timeouts) {
            this.logger.log("Ignoring schedule for " + serviceName + " (timeout already existing)")
            return null;
        }

        if (!service.delay) {
            this.logger.log("Executing " + serviceName + " (no delay)");
            await this.launch(serviceName, service)
                .catch(error => {throw new Error(error)})
            return true;
        }
        else {
            this.timeouts[serviceName] = {
                timeout: setTimeout(
                    () => this.delayedLaunch(serviceName),
                    service.delay * 1000
                ),
                name: serviceName,
                service
            }
            this.logger.log("Executing " + serviceName + ` (delayed by ${service.delay} seconds)`);
            return null;
        }
    }
}