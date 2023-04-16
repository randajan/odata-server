import { pathToRegexp } from 'path-to-regexp';
import jet from "@randajan/jet-core";

import actions from "../actions";
import { decodeParam } from '../tools';

const { solid, cached, virtual } = jet.prop;

export class Route {
    constructor(server, method, path, action) {

        const keys = [];

        cached(this, {}, "regex", _ => pathToRegexp(path, keys), false);
        virtual(this, "keys", _ => { this.regex; return keys; }, false);

        solid(this, "server", server, false);
        solid.all(this, {
            method,
            path,
            action
        });

        solid(this, "resolve", actions[action]);

        if (!this.resolve) {
            throw Error(this.msg(`action '${action}' is not one of: '${Object.keys(actions).join(", ")}'`));
        }

    }

    msg(text) {
        return this.server.msg(`route '${this.path}' ${text}`);
    }

    test(pathname) {
        return this.regex.test(pathname);
    }

    parseParams(pathname) {
        const { action, regex, keys } = this;
        const ex = regex.exec(pathname);

        if (!ex) { throw Error(this.msg(`parseParams('${pathname}') failed`)); }
        const params = {};

        for (let i = 0; i < keys.length; i++) {
            solid(params, keys[i].name, decodeParam(ex[i + 1]));
        }
        
        solid(params, "count", action === "count");

        return params;
    }

}