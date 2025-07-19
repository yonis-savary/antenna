import { IncomingMessage } from "http";

export async function getRequestBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
        let body = '';

        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', () => {
            try {
                resolve(body);
            } catch (err) {
                reject(err);
            }
        });

        req.on('error', reject);
    });
}