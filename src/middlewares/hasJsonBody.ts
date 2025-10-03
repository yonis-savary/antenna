import { IncomingMessage, ServerResponse } from "http";
import { getRequestBody } from "../utils";
import { RouterRequest } from "../router";

export default async function hasJsonBody (req: RouterRequest, res: ServerResponse<IncomingMessage>): Promise<boolean> {
    if (req.headers['content-type'] !== "application/json")
        return false;

    if (req.method?.toLowerCase() !== 'post')
        return false;

    return true;
}