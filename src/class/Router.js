import methods from 'methods';
import jet from "@randajan/jet-core";

import { Route } from "./Route.js";

import { buildMetadata } from '../meta/metadata.js';
import { getCollections } from '../meta/collections.js';

import { query } from '../methods/query.js';
import { insert } from '../methods/insert.js';
import { update } from '../methods/update.js';
import { remove } from '../methods/remove.js';

const { solid, virtual } = jet.prop;

export class Router {
  constructor(ods, prefix) {
    solid.all(this, {
      ods,
    }, false);

    solid.all(this, {
      prefix,
      routes: {}
    })

    this.get('/', (req, res) => {
      const result = getCollections(ods);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');

      return result;
    });

    this.get('/\$metadata', (req, res) => {
      const result = buildMetadata(ods);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('DataServiceVersion', '4.0');
      res.setHeader('OData-Version', '4.0');

      return result;
    });

    this.get('/:collection/\$count', (req, res) => {
      solid(req.odata.params, "$count", true);
      return query(req, res);
    });
    this.get('/:collection\\(:id\\)', query);
    this.get('/:collection', query);

    this.patch('/:collection\\(:id\\)', update);
    this.delete('/:collection\\(:id\\)', remove);
    this.post('/:collection', insert);

    if (ods.cors) {
      this.options('/(.*)', (req, res) => {
        res.statusCode = 200;
      });
    }

  }

  async dispatch(req, res) {
    const method = req.method.toLowerCase()

    for (const route of this.routes[method]) {
      if (await route.resolve(req, res)) { return true; }
    }

    throw Error({ code: 404, msg: "Not found" });

  }

  addCors(res) {
    const cors = this.ods.cors;
    if (cors) { res.setHeader('Access-Control-Allow-Origin', cors); }
  }


}

methods.forEach(method => {
  Router.prototype[method] = function (path, exe) {
    const list = this.routes[method] || (this.routes[method] = []);
    const route = new Route(this, path, exe);
    list.push(route);
    return route;
  }
});