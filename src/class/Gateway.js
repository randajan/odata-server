import jet from "@randajan/jet-core";

import { parseUrl } from "../tools";
import { Context } from "./Context";

const { solid } = jet.prop;

export class Gateway {

    constructor(server, url, options={}, extendArgs=[]) {
        const { adapter, filter, extender } = options;

        solid.all(this, {
            url:parseUrl(url, false),
        });

        solid.all(this, {
            server,
            fetchContext:async responder=>{
                const context = new Context(this, await server.fetchModel(), responder, adapter, filter);
                if (jet.isRunnable(extender)) { await extender(context, ...extendArgs); }
                return context;
            }
        }, false);

    }

    msg(text) {
        return this.server.msg(this.url.pathname + " " + text);
    }

    async resolve(responder) {
        const { server } = this;
        let context;

        try {
            responder.setHeader('OData-Version', '4.0');
            responder.setHeader('DataServiceVersion', '4.0');
            if (server.cors) { responder.setHeader('Access-Control-Allow-Origin', server.cors); }

            context = await this.fetchContext(responder);
            return context.route.resolve(context);

        } catch (e) {

            const error = {
                code: e?.code || 500,
                message: e?.msg || e?.message || "Unknown error",
                stack: e?.stack,
                method: responder.getMethod(),
                target: responder.getURL(),
                details: []
            }

            responder.setHeader('Content-Type', 'application/json');
            responder.setBody(error.code, JSON.stringify({ error }));

            server.onError(context, error);

        }

    }

}