import { pathToRegexp } from 'path-to-regexp';
import jet from "@randajan/jet-core";

const { solid, cached, virtual } = jet.prop;

export class Route {
    constructor(router, path, resolver) {

        const keys = [];

        solid.all(this, {
            router,
            resolver
        }, false);

        cached(this, {}, "regex", _=>pathToRegexp(path, keys), false);
        virtual(this, "keys", _=>{ this.regex; return keys; }, false);

        solid(this, "path", path);

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
        const params = this.parseParams(req.odata.url.pathname);

        if (!params) { return false; }

        req.params = params;
        solid.all(req.odata, {
            route:this,
            params,
        });

        this.router.addCors(res);

        const result = await this.resolver(req, res);
        
        res.end(result);
        
        return true;
    }

}