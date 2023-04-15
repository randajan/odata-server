import { parse as parseUrl } from "url";

import jet from "@randajan/jet-core";

import { _fetchOptions } from "../parsers/options";
import { _fetchBody } from "../parsers/inputs";
import { getScope, getScopeMeta } from "../tools";
import { pullBody } from "../parsers/types";

const { solid, cached } = jet.prop;


export class Context {
    constructor(server, req, model, adapter, filter) {

        solid(this, "request", req, false);
        solid.all(this, {
            server,
            model,
            filter:jet.isRunnable(filter) ? (collection, property)=>filter(this, collection, property) : _=>true
        })

        cached.all(this, {}, {
            method: _ => req.method.toLowerCase(),
            url: _ => parseUrl(req.originalUrl || req.url, true),
            route: _ => server.findRoute(this.method, this.url.pathname),
            params: _ => this.route.parseParams(this.url.pathname),
        });

        cached.all(this, {}, {
            _entity: async _ =>{
                const { collection } = this.params;
                if (await this.filter(collection)) { return model.findEntity(collection); }
                throw { code:403, msg:`Forbidden` };
            },
            _options: async _ => _fetchOptions(this.url, this.params, (await this._entity).primaryKey),
            _requestBodyRaw: async _=>_fetchBody(req),
            _responseBodyRaw: async _=>{
                const { action } = this.route;
                if (adapter[action]) { return adapter[action](this); }
                throw { code:501, msg:`Action '${action}' is not implemented` };
            }
        }, false);
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

    async fetchEntity() {
        return this._entity;
    }

    async fetchOptions() {
        return this._options;
    }

    async fetchRequestBodyRaw() {
        return this._requestBodyRaw;
    }

    async fetchResponseBodyRaw() {
        return this._responseBodyRaw;
    }

    async pullRequestBody(to={}) {
        return pullBody(this, to, await this.fetchRequestBodyRaw(), "toAdapter");
    }

    async pullResponseBody(to={}) {
        return pullBody(this, to, await this.fetchResponseBodyRaw(), "toResponse");
    }

 

}