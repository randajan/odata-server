import { pathToRegexp } from 'path-to-regexp';
import jet from "@randajan/jet-core";

import actions from "../actions";

const { solid, cached, virtual } = jet.prop;

const decodeParam = param=>param && decodeURIComponent(param).replace(/(^["'`]+)|(["'`]+$)/g, "");

export class Route {
    constructor(method, path, action) {

        const keys = [];

        cached(this, {}, "regex", _ => pathToRegexp(path, keys), false);
        virtual(this, "keys", _ => { this.regex; return keys; }, false);

        solid.all(this, {
            method,
            path,
            action,
        });

        solid(this, "resolver", actions[action]);

        if (!this.resolver) {
            throw Error(`Route action '${action}' is not implemented. Available actions: '${Object.keys(actions).join(", ")}' `);
        }

    }

    test(pathname) {
        return this.regex.test(pathname);
    }

    parseParams(pathname) {
        const { regex, keys } = this;
        const ex = regex.exec(pathname);

        if (!ex) { return; }
        const params = {};

        for (let i = 0; i < keys.length; i++) {
            solid(params, keys[i].name, decodeParam(ex[i + 1]));
        }

        return params;
    }

}