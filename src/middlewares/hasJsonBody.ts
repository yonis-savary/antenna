import { IncomingMessage, ServerResponse } from "http";
import { getRequestBody } from "../utils";
import { RouterRequest } from "../router";

export default async function hasJsonBody (req: RouterRequest, res: ServerResponse<IncomingMessage>): Promise<boolean> {
    const sendBaseErrorMessage = ()=>{
        res.writeHead(422);
        res.write('Please use a POST request with json body/header');
        res.end();
        return false;
    }

    if (req.headers['content-type'] !== "application/json")
        return sendBaseErrorMessage();

    if (req.method?.toLowerCase() !== 'post')
        return sendBaseErrorMessage();

    return true;
}