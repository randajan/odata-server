import { parse as parseUrl } from "url";

import jet from "@randajan/jet-core";

import { parseOptions } from "../validations/options";

const { solid, cached } = jet.prop;

export class Context {
    constructor(server, req) {
        
        solid.all(this, {
            server,
        });

        cached.all(this, {}, {
            method:_=>req.method.toLowerCase(),
            url:_=>parseUrl(req.originalUrl || req.url, true),
            route:_=>server.findRoute(this.method, this.url.pathname),
            params:_=>this.route.parseParams(this.url.pathname),
            options:_=>parseOptions(this.url, this.params),
            entity:_=>server.findEntity(this.params.collection),
            keys:_=>Object.entries(this.entity.entityType).filter(([k, v])=>v?.key).map(([k])=>k)
        });

        solid(req, "context", this);
    }
}