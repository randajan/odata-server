import jet from "@randajan/jet-core";

import { escapeRegExp, vault } from "../tools";

import { Route } from "./Route";

import { Context } from "./Context";
import { Model } from "./Model";

const { solid, virtual, cached } = jet.prop;

export class Server {
  constructor(config={}) {

    const { url, model, cors, adapter, converter, filter } = config;

    const [ uid, _p ] = vault.set({
      isInitialized:false,
      url,
      cors,
      routes:{},
      adapter,
      filter
    });

    solid.all(this, {
      uid,
    }, false);

    virtual.all(this, {
      url:_=>_p.url,
      resolver:_=>this.resolve.bind(this)
    });

    cached(_p, {}, "model", async _=>new Model(this, jet.isRunnable(model) ? await model() : model, converter));

    this.addRoute("delete", '/:entity\\(:id\\)', "remove");
    this.addRoute("patch", '/:entity\\(:id\\)', "update");
    this.addRoute("post", '/:entity', "insert");

    this.addRoute("get", '/:entity/\$count', "count");
    this.addRoute("get", '/:entity\\(:id\\)', "query");
    this.addRoute("get", '/:entity', "query");

    this.addRoute("get", '/\$metadata', "metadata");
    this.addRoute("get", '/', "collections");

    if (cors) { this.addRoute("options", '/(.*)', ()=>{}); }

  }

  msg(text) {
    return "ODataServer: " + text;
  }

  addRoute(method, path, action) {
    const { routes } = vault.get(this.uid);
    const list = routes[method] || (routes[method] = []);
    const route = new Route(method, path, action);
    list.push(route);
    return route;
  }

  findRoute(method, path) {
    const _p = vault.get(this.uid);
    const routes = _p.routes[method] || [];

    for (const route of routes) {
      if (route.test(path)) { return route; }
    }

    throw { code: 404, msg: "Not found" };
  }

  async resolve(req, res) {
    try {
      const _p = vault.get(this.uid);

      if (!_p.url) {
        if (!req.protocol) {
          throw Error(this.text('Unable to determine server url from the request or value provided in the ODataServer constructor.'))
        }

        // If mounted in express, trim off the subpath (req.url) giving us just the base path
        const path = (req.originalUrl || '/').replace(escapeRegExp(req.url), '');
        _p.url = (req.protocol + '://' + req.get('host') + path);
      }

      res.setHeader('OData-Version', '4.0');
      res.setHeader('DataServiceVersion', '4.0');
      if (_p.cors) { res.setHeader('Access-Control-Allow-Origin', _p.cors); }

      const context = new Context(this, req, await _p.model, _p.adapter, _p.filter);
      const { action, resolver } = context.route;

      if (action === "count") { solid(context.params, "count", true); }

      await resolver(context, res);

    } catch(e) {

        const error = {
          code:e?.code || 500,
          message: e?.msg || e?.message || "Unknown error",
          stack: e?.stack,
          method: req.method,
          target: req.url,
          details: []
        }

        res.statusCode = error.code;
        res.setHeader('Content-Type', 'application/json');

        res.end(JSON.stringify({ error }))

    }

  }

}
