import { exec } from "child_process";
import { ServiceConfig } from "./types/config-types";
import Logger from "./logger";
import CommandOutput from "./types/command-output";

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
        let processLogger = new Logger(serviceName);

        let outputs: CommandOutput[] = [];
        processLogger.log(`Launching service ${serviceName}`)
        for (const command of service.commands) {

            const escapedBody = body.replace(/"/g, '\\"');
            let commandToLaunch = command

            if (service.injection == 'pipe')
                commandToLaunch = `echo \"${escapedBody}\" | ${command}`

            if (service.injection == 'variable')
                commandToLaunch = `${service.injection_variable}="${escapedBody}"; ${command}`

            processLogger.log(`> ${commandToLaunch}`);

            const output = await new Promise((resolve, reject) => {
                exec(commandToLaunch, { cwd: service.directory }, (error, stdout, stderr) => {
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
            }) as string;

            outputs.push({command, output})
        }

        return outputs
    }

    async schedule(serviceName: string, service: ServiceConfig, body: string): Promise<CommandOutput[]> {
        if (serviceName in this.timeouts) {
            this.logger.log("Ignoring schedule for " + serviceName + " (timeout already existing)")
            return [];
        }

        if (!service.delay) {
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