import { Config, ConfigSchema } from "./types/config-types";
import { existsSync, readFileSync } from "fs";
import yaml from 'yaml'
import Logger from "./logger";


export default function loadConfig(): Config {
    const CONFIG_FILE = process.env.CONFIG_FILE ?? './antenna.yaml';

    const logger = new Logger('configuration');

    if (!existsSync(CONFIG_FILE)) {
        logger.error('Fatal error: could not read ' + CONFIG_FILE + ' file');
        process.exit(1)
    }

    console.log(`Reading configuration file...`);

    const file = readFileSync(CONFIG_FILE, 'utf8');
    const parsed = yaml.parse(file);

    const result = ConfigSchema.safeParse(parsed);

    if (!result.success) {
        logger.error('Fatal Error: Could not validate configuration file');
        for (const issue of result.error.issues) {
            logger.error(`- ${issue.path.join('.')} : ${issue.message}`);
        }
        process.exit(1);
    }

    const configErrors: string[] = [];

    Object.entries(result.data).forEach(([name, config]) => {
        if (!existsSync(config.directory)) {
            configErrors.push(`${name}.directory: ${config.directory} is not a directory`)
        }
    })

    if (configErrors.length) {
        logger.error('Fatal Error: bad configuration');
        for (const message of configErrors)
            logger.error(message)
        process.exit(1)
    }

    return result.data;
}