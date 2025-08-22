import { exec } from "child_process";
import CommandOutput from "./types/command-output";
import { ServiceConfig } from "./types/config-types";
import Logger from "./logger";

export default class Process {

    private serviceName: string;
    private service: ServiceConfig;
    private body: string;

    constructor(serviceName: string, service: ServiceConfig, body: string) {
        this.serviceName = serviceName
        this.service = service
        this.body = body
    }

    async launch(): Promise<CommandOutput[]> {
        let processLogger = new Logger(this.serviceName);

        let outputs: CommandOutput[] = [];
        processLogger.log(`Launching service ${this.serviceName}`)
        for (const command of this.service.commands) {

            const escapedBody = this.body.replace(/"/g, '\\"');
            let commandToLaunch = command

            switch (this.service.injection) {
                case 'pipe':
                    commandToLaunch = `echo \"${escapedBody}\" | ${command}`
                    break;
                case 'variable':
                    commandToLaunch = `${this.service.injection_variable}="${escapedBody}"; ${command}`
                    break;
                case 'argv':
                    commandToLaunch = `${command} --${this.service.injection_variable}="${escapedBody}"`
                    break;
            }

            processLogger.log(`> ${commandToLaunch}`);

            const output = await new Promise((resolve, reject) => {
                exec(commandToLaunch, { cwd: this.service.directory }, (error, stdout, stderr) => {
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

            const result = {command} as CommandOutput;
            if (this.service.show_output)
                result.output = output

            outputs.push(result)
        }

        return outputs
    }
}