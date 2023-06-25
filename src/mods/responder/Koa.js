import jet from "@randajan/jet-core";

const { solid } = jet.prop;

export class KoaResponder {

    constructor(context) {
        solid.all(this, {context});
    }

    getURL() {
        return this.context.request.url;
    }

    getMethod() {
        return this.context.request.method;
    }

    async getBody() {
        const ctx = this.context;
        const req = ctx.request;

        const body = ctx.body || req.body;

        if (body) { return body; }
    
        return new Promise((res, rej) => {
            let body = "";
            req.on('data', data => {
                if ((body += data).length > 1e6) { rej({ statusCode: 400, msg: "Request is too long" }); }
            });
            req.on('end', _ => {
                try { res(body ? JSON.parse(body) : undefined); }
                catch(e) { rej({ statusCode:400, msg:e.message }); }
            });
        });
    }

    getType() {
        const ctx = this.context;
        const json = ctx.accepts("json");
        const xml = ctx.accepts("xml");
        if (xml !== json) { return xml ? "xml" : "json"; }
    }

    setHeader(name, value) {
        this.context.set(name, value);
    }

    setBody(statusCode, body) {
        this.context.status = statusCode;
        this.context.body = body;
    }
    
}

export default (ctx)=>new KoaResponder(ctx);