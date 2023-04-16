
import jet from "@randajan/jet-core";

import { parseUrl, trimUrl, unwrap, vault } from "../tools";

import { Route } from "./Route";

import { Context } from "./Context";
import { Model } from "./Model";
import { Interface } from "./Interface";

const { solid } = jet.prop;

export class Server {
  constructor(options={}) {

    const { model, cors, converter } = options;

    const [ uid, _p ] = vault.set({
      routes:{},
      //model
    });

    solid(this, "uid", uid, false);
    solid(this, "cors", String.jet.to(cors));

    solid.all(this, {
      fetchModel:async _=>{
        if (_p.model) { return _p.model; }
        return _p.model = new Model(this, await (jet.isRunnable(model) ? model() : model), converter);
      },
      serve:(url, ...extendArgs)=>{
        const int = new Interface(this, url, options, extendArgs);
        return int.resolve.bind(int);
      }
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
    const { routes } = vault.get(this.uid);
    const list = routes[method] || (routes[method] = []);
    const route = new Route(this, method, path, action);
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

}
