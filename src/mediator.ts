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
                    if (error) {
                        processLogger.error(`Execution error: ${error.message}`);
                    }
                    if (stderr) {
                        processLogger.error(`stderr: ${stderr}`);
                    }
                    if (stdout) {
                        processLogger.log(`stdout: ${stdout}`);
                    }
                    if (!(error || stderr || stdout)) {
                        processLogger.log(`No output`);
                    }

                    resolve(stdout)
                })
            })
        }
    }

    schedule(serviceName: string, service: ServiceConfig) {
        if (serviceName in this.timeouts) {
            this.logger.log("Ignoring schedule for " + serviceName + " (timeout already existing)")
            return;
        }

        if (!service.delay) {
            this.logger.log("Executing directly " + serviceName);
            this.launch(serviceName, service)
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
            this.logger.log("Setting timeout for " + serviceName)
        }
    }
}