import jet from "@randajan/jet-core";

import { escapeRegExp, vault } from "../tools";

import { Route } from "./Route";

import { Context } from "./Context";
import { Model } from "./Model";
import { knownActions } from "../consts";

const { solid, virtual, cached } = jet.prop;

export class Server {
  constructor(config={}) {

    const { url, model, cors, adapter, converter } = config;

    const [ uid, _p ] = vault.set({
      url,
      cors,
      routes:{},
      adapter
    });

    solid.all(this, {
      uid
    }, false);

    virtual.all(this, {
      url:_=>_p.url,
      resolver:_=>this.resolve.bind(this)
    });

    cached(this, _p, "model", _=>new Model(this, model, converter));

    this.addRoute("get", '/', "collections");
    this.addRoute("get", '/\$metadata', "metadata");

    this.addRoute("get", '/:collection/\$count', "count");
    this.addRoute("get", '/:collection\\(:id\\)', "query");
    this.addRoute("get", '/:collection', "query");

    this.addRoute("patch", '/:collection\\(:id\\)', "update");
    this.addRoute("delete", '/:collection\\(:id\\)', "remove");
    this.addRoute("post", '/:collection', "insert");

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

      if (!_p.url && !req.protocol) {
        throw Error(this.text('Unable to determine server url from the request or value provided in the ODataServer constructor.'))
      }
    
      // If mounted in express, trim off the subpath (req.url) giving us just the base path
      const path = (req.originalUrl || '/').replace(new RegExp(escapeRegExp(req.url) + '$'), '')
      if (!_p.url) { _p.url = (req.protocol + '://' + req.get('host') + path); };

      const context = new Context(this, req);

      res.setHeader('OData-Version', '4.0');
      res.setHeader('DataServiceVersion', '4.0');
      if (_p.cors) { res.setHeader('Access-Control-Allow-Origin', _p.cors); }

      const { action, resolver } = context.route;

      if (action === "count") { solid(context.params, "count", true); }

      if (!knownActions.includes(action)) { await resolver(req, res); return; }
      if (!_p.adapter[action]) { throw {code:501, msg:"Not Implemented"}; }
      
      await resolver(req, res, await _p.adapter[action](context));

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
