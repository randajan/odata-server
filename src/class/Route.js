import { pathToRegexp } from 'path-to-regexp';
import jet from "@randajan/jet-core";

const { solid, cached, virtual } = jet.prop;

export class Route {
    constructor(method, path, resolver) {

        const keys = [];

        solid.all(this, {
            resolver
        }, false);

        cached(this, {}, "regex", _ => pathToRegexp(path, keys), false);
        virtual(this, "keys", _ => { this.regex; return keys; }, false);

        solid.all(this, {
            method,
            path
        });

    }

    decodeParam(param) { return param && decodeURIComponent(param); }

    parseParams(pathname) {
        const { regex, keys } = this;
        const ex = regex.exec(pathname);

        if (!ex) { return; }
        const params = {};

        for (let i = 0; i < keys.length; i++) {
            solid(params, keys[i].name, this.decodeParam(ex[i + 1]));
        }

        return params;
    }

    async resolve(req, res) {
        const { odata } = req;
        const { url, server:{ cors } } = odata;
        const params = this.parseParams(url.pathname);

        if (!params) { return false; }

        req.params = params;
        solid.all(odata, {
            route: this,
            params,
        });

        res.setHeader('OData-Version', '4.0');
        res.setHeader('DataServiceVersion', '4.0');
        if (cors) { res.setHeader('Access-Control-Allow-Origin', cors); }

        const result = await this.resolver(req, res);

        if (Object.jet.is(result)) {
            res.stateCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
        } else if (result) {
            res.stateCode = 200;
            res.end(result);
        } else {
            res.stateCode = 204;
        }

        return true;
    }

}