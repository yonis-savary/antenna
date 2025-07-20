import { IncomingMessage, ServerResponse } from "http";
import { ServiceConfig } from "../types/config-types";
import { createHmac } from "crypto";
import { RouterRequest } from "../router";
import Logger from "../logger";

export default async function sha256ChecksOut(req: RouterRequest, res: ServerResponse<IncomingMessage>, serviceName: string, service: ServiceConfig): Promise<boolean> {
    if (!service.secret)
        return true;

    const headerName = service.secret_header ?? 'x-hub-signature-256';

    const signature = (req.headers[headerName] ?? '') as string;
    if (!signature)
        return false;

    const hmac = createHmac('sha256', service.secret);
    const digest = 'sha256=' + hmac.update(req.body.toString()).digest('hex');

    const logger = new Logger(serviceName);

    if (signature !== digest) {
        logger.error(`Invalid signature : ${signature} !== ${digest}`);

        res.writeHead(401);
        res.write('Invalid signature');
        res.end()
        return false;
    }

    logger.log("SHA256 digest checks out")

    return true;
}