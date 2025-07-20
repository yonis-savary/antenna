// test/utils/mock-http.ts
import { IncomingMessage, ServerResponse } from 'http';
import { Readable, Writable } from 'stream';
import { createHmac } from "crypto";

export function createMockReq(options: Partial<IncomingMessage> & { body?: any } = {}): IncomingMessage {
  const req = new Readable() as IncomingMessage;
  req.method = options.method || 'GET';
  req.url = options.url || '/';
  req.headers = options.headers || {};
  if (options.body) {
    req.push(options.body);
  }
  req.push(null); // fin du stream
  return Object.assign(req, options);
}

type Headers = Record<string, string | number | readonly string[]>;
type MockResponse = ServerResponse & { _data: string; _statusCode: number, _headers: Headers }

export function createMockRes(): MockResponse {
  let data = '';
  let headers: Headers = {};
  const res = new Writable() as unknown as MockResponse;


  res.setHeader = (name: string, value: string | number | readonly string[]) => {
    headers[name] = value;
    return res;
  },

  res.write = (chunk: any) => {
    data += chunk.toString();
    return true;
  };
  res.end = (chunk?: any) => {
    if (chunk) data += chunk.toString();
    res._data = data;
    res._headers = headers;
    return res;
  };
  res.writeHead = (statusCode: number) => {
    res._statusCode = statusCode;
    return res;
  };
  return res;
}



export function calculateSha256Digest (secret: string, body: string): string {
  const hmac = createHmac('sha256', secret);
  return 'sha256=' + hmac.update(body).digest('hex');
}