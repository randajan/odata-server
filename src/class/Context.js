import { parse as parseUrl } from "url";

import jet from "@randajan/jet-core";

import { fetchOptions } from "../parsers/options";
import { fetchBody } from "../parsers/inputs";
import { getScope, getScopeMeta } from "../tools";
import { convertToAdapter } from "../parsers/types";

const { solid, cached } = jet.prop;

export class Context {
    constructor(server, req) {

        solid(this, "server", server);

        cached.all(this, {}, {
            method: _ => req.method.toLowerCase(),
            url: _ => parseUrl(req.originalUrl || req.url, true),
            route: _ => server.findRoute(this.method, this.url.pathname),
            params: _ => this.route.parseParams(this.url.pathname),
            entity: _ => server.model.findEntity(this.params.collection),
            options: _ => fetchOptions(this.url, this.params, this.entity.primaryKey)
        });

        let body;
        solid(this, "getBody", async (isOne=true)=>convertToAdapter(this.entity.props, body || (body = await fetchBody(req)), isOne));

        solid(req, "context", this);
    }

    getScope(ids, quote = "") {
        const { server:{url}, params:{collection} } = this;
        return url + "/" + getScope(collection, ids, quote);
    }

    getScopeMeta(ids, quote = "") {
        const { server:{url}, params:{collection} } = this;
        return url + "/" + getScopeMeta(collection, ids, quote);
    }

    getScopeMetaEntity(ids, quote = "") {
        return this.getScopeMeta(ids, quote)+"/$entity";
    }

}