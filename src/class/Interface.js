import jet from "@randajan/jet-core";

import { parseUrl } from "../tools";
import { Context } from "./Context";

const { solid } = jet.prop;


export class Interface {

    constructor(server, url, options={}, extendArgs=[]) {
        const { adapter, filter, extender, onError } = options;

        solid.all(this, {
            server,
            url:parseUrl(url, false),
            fetchContext:async req=>{
                const context = new Context(this, req, await server.fetchModel(), adapter, filter);
                if (jet.isRunnable(extender)) { await extender(context, ...extendArgs); }
                return context;
            },
            onError:jet.isRunnable(onError) ? onError : ()=>{}
        }, false);

    }

    msg(text) {
        return this.server.msg(this.url.pathname + " " + text);
    }

    async resolve(req, res) {
        const { server } = this;
        let context;

        try {

            res.setHeader('OData-Version', '4.0');
            res.setHeader('DataServiceVersion', '4.0');
            if (server.cors) { res.setHeader('Access-Control-Allow-Origin', server.cors); }

            context = await this.fetchContext(req);
            const { resolve } = context.route;

            await resolve(context, res);

        } catch (e) {

            const error = {
                code: e?.code || 500,
                message: e?.msg || e?.message || "Unknown error",
                stack: e?.stack,
                method: req.method,
                target: req.url,
                details: []
            }

            res.statusCode = error.code;
            res.setHeader('Content-Type', 'application/json');

            this.onError(context, error);
            res.end(JSON.stringify({ error }))

        }

    }

}