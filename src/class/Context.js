import jet from "@randajan/jet-core";

import { _fetchOptions } from "../parsers/options";
import { _fetchBody } from "../parsers/inputs";
import { getScope, getScopeMeta, isWrapped, parseUrl, trimUrl, unwrap } from "../tools";
import { pullBody } from "../parsers/types";

const { solid, cached } = jet.prop;


export class Context {
    constructor(int, req, model, options={}, extendArgs=[]) {
        const { server } = int;
        const { adapter, filter, extender, } = options;

        solid.all(this, {
            "request":req,
            filter:jet.isRunnable(filter) ? (entity, property)=>filter(this, entity, property) : _=>true
        }, false);

        solid.all(this, {
            server,
            int,
            model
        });

        cached.all(this, {}, {
            url: _ =>{
                const urlReq = (req.originalUrl || req.url);
                const urlBase = trimUrl(int.url.pathname);
                if (!isWrapped(urlReq, urlBase)) { return {}; }
                return parseUrl(unwrap(urlReq, urlBase), true);
            },
            method: _ => req.method.toLowerCase(),
            route: _ => server.findRoute(this.method, this.url.pathname),
            params: _ => this.route.parseParams(this.url.pathname)
        });

        cached.all(this, {}, {
            _entity: async _ =>{
                const { entity } = this.params;
                if (await this.filter(entity)) { return model.findEntity(entity); }
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

        if (jet.isRunnable(extender)) { extender(this, ...extendArgs); }
    }

    getScope(ids, quote = "") {
        const { int:{url}, params:{entity} } = this;
        return url + "/" + getScope(entity, ids, quote);
    }

    getScopeMeta(ids, quote = "") {
        const { int:{url}, params:{entity} } = this;
        return url + "/" + getScopeMeta(entity, ids, quote);
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