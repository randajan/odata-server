
import jet from "@randajan/jet-core";

import { parseUrl, trimUrl, unwrap, vault } from "../tools";

import { Route } from "./Route";

import { Model } from "./Model";
import { Gateway } from "./Gateway";

import { solid, solids, cacheds } from "@randajan/props";

export class Server {
  constructor(options={}) {

    const { model, cors, converter, onError } = options;

    const _p = {
      routes:{},
    }

    vault.set(this, _p);

    solid(this, "cors", String.jet.to(cors));

    cacheds(this, _p, {
      _model:async _=>new Model(this, await (jet.isRunnable(model) ? model() : model), converter)
    }, false);

    solids(this, {
      serve:(responder, url, ...extendArgs)=>{
        const gw = new Gateway(this, url, options, extendArgs);
        return (...a)=>gw.resolve(responder(...a));
      },
      onError:jet.isRunnable(onError) ? onError : ()=>{}
    }, false);

    this.addRoute("get", '/', "collections");
    this.addRoute("get", '/\$metadata', "metadata");

    this.addRoute("get", '/:entity/\$count', "count");
    this.addRoute("get", '/:entity\\(:id\\)', "query");
    this.addRoute("get", '/:entity', "query");

    this.addRoute("delete", '/:entity\\(:id\\)', "remove");
    this.addRoute("patch", '/:entity\\(:id\\)', "update");
    this.addRoute("post", '/:entity', "insert");

    if (this.cors) { this.addRoute("options", '/(.*)', "cors"); }

  }

  msg(text) {
    return "OData server " + text;
  }

  addRoute(method, path, action) {
    const { routes } = vault.get(this);
    const list = routes[method] || (routes[method] = []);
    const route = new Route(this, method, path, action);
    list.push(route);
    return route;
  }

  findRoute(method, path) {
    const _p = vault.get(this);
    const routes = _p.routes[method] || [];

    for (const route of routes) {
      if (route.test(path)) { return route; }
    }

    throw { code: 404, msg: "Not found" };
  }

  async fetchModel() {
    return this._model;
  }

}
