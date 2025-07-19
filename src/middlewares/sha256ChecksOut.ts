import { IncomingMessage, ServerResponse } from "http";
import { ServiceConfig } from "../types/config-types";
import { createHmac } from "crypto";
import { RouterRequest } from "../router";

export default async function sha256ChecksOut(req: RouterRequest, res: ServerResponse<IncomingMessage>, service: ServiceConfig): Promise<boolean> {
    if (!service.secret)
        return true;

    const signature = req.headers['x-hub-signature-256'] as string;
    const hmac = createHmac('sha256', service.secret);
    const digest = 'sha256=' + hmac.update(req.body.toString()).digest('hex');

    if (signature !== digest) {
        console.log(`${signature} !== ${digest}`)
        res.writeHead(401);
        res.write('Invalid signature');
        res.end()
        return false;
    }

    return true;
}