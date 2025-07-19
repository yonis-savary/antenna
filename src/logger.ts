const formatMessage = (service: string, message: string) =>{
    const date    = new Date();
    const year    = date.getFullYear();
    const month   = (date.getMonth()+1).toString().padStart(2,'0');
    const day     = date.getDate().toString().padStart(2,'0');
    const hour    = date.getHours().toString().padStart(2,'0');
    const minute  = date.getMinutes().toString().padStart(2,'0');
    const seconds = date.getSeconds().toString().padStart(2,'0');

    return `[${service}] [${year}-${month}-${day} ${hour}:${minute}:${seconds}] ${message}`.trim()
}

export const log = (service: string, message: string) => {
    console.log(formatMessage(service, message));
}

export const warn = (service: string, message: string) => {
    console.warn(formatMessage(service, message));
}

export const info = (service: string, message: string) => {
    console.info(formatMessage(service, message));
}

export const error = (service: string, message: string) => {
    console.error(formatMessage(service, message));
}

export default class Logger {
    private service: string;

    constructor(service: string) {
        this.service = service;
    }

    log(message: string) { log(this.service, message) }
    warn(message: string) { warn(this.service, message) }
    info(message: string) { info(this.service, message) }
    error(message: string) { error(this.service, message) }
}