import jet from "@randajan/jet-core";

import { _fetchOptions } from "../parsers/options";
import { getScope, getScopeMeta, isWrapped, parseUrl, trimUrl, unwrap } from "../tools";
import { pullBody } from "../parsers/types";

const { solid, cached, safe } = jet.prop;

export class Context {
    constructor(gw, model, responder, adapter, filter) {
        const { server } = gw;

        solid.all(this, {
            server,
            gw,
            model
        });

        solid.all(this, {
            responder,
            filter:jet.isRunnable(filter) ? (entity, property)=>filter(this, entity, property) : _=>true
        }, false);

        cached.all(this, {}, {
            url: _ =>{
                const urlReq = responder.getURL();
                const urlBase = trimUrl(gw.url.pathname);
                if (!isWrapped(urlReq, urlBase)) { return {}; }
                return parseUrl(unwrap(urlReq, urlBase), true);
            },
            method: _ => responder.getMethod().toLowerCase(),
            route: _ => server.findRoute(this.method, this.url.pathname),
            params: _ => this.route.parseParams(this.url.pathname)
        });

        cached.all(this, {}, {
            _entity: async _ =>{
                const { entity } = this.params;
                if (await this.filter(entity)) { return this.model.findEntity(entity); }
                throw { code:403, msg:`Forbidden` };
            },
            _options: async _ => _fetchOptions(this.url, this.params, (await this._entity).primaryKey),
            _requestBodyRaw: async _=>responder.getBody(),
            _responseBodyRaw: async _=>{
                const { action } = this.route;
                if (adapter[action]) { return adapter[action](this); }
                throw { code:501, msg:`Action '${action}' is not implemented` };
            }
        }, false);
    }

    getScope(ids, quote = "") {
        const { gw:{url}, params:{entity} } = this;
        return url + "/" + getScope(entity, ids, quote);
    }

    getScopeMeta(ids, quote = "") {
        const { gw:{url}, params:{entity} } = this;
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
        return pullBody(await this.fetchRequestBodyRaw(), "toAdapter", this, to);
    }

    async pullResponseBody(to={}) {
        return pullBody(await this.fetchResponseBodyRaw(), "toResponse", this, to);
    }

}