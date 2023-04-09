import { Buffer } from "safe-buffer";
import jet from "@randajan/jet-core";

import { escapeRegExp, vault } from "../tools";

import { prune } from '../validations/prune.js';
import { Route } from "./Route";

import methods from "../methods";
import { Context } from "./Context";

const { query, insert, update, remove, collections, metadata, count } = methods;


const { solid, virtual } = jet.prop;

export class Server {
  constructor(config={}) {

    const { url, model, cors, resolver } = config;

    const [ uid, _p ] = vault.set({
      url,
      model,
      cors,
      routes:{},
      resolver
    });

    solid.all(this, {
      uid
    }, false);

    virtual.all(this, {
      url:_=>_p.url,
      model:_=>_p.model
    });

    this.addRoute("get", '/', collections);
    this.addRoute("get", '/\$metadata', metadata);

    this.addRoute("get", '/:collection/\$count', count);
    this.addRoute("get", '/:collection\\(:id\\)', query);
    this.addRoute("get", '/:collection', query);

    this.addRoute("patch", '/:collection\\(:id\\)', update);
    this.addRoute("delete", '/:collection\\(:id\\)', remove);
    this.addRoute("post", '/:collection', insert);

    if (cors) { this.addRoute("options", '/(.*)', ()=>{}); }

  }

  addRoute(method, path, resolver) {
    const { routes } = vault.get(this.uid);
    const list = routes[method] || (routes[method] = []);
    const route = new Route(method, path, resolver);
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

  findEntity(name) {
    const { namespace, entitySets, entityTypes } = this.model;
    const es = entitySets[name];
    const est = es ? es.entityType.split(".") : [];
    if (namespace !== est[0]) { throw { code:404, msg:"Entity set not found" }; }
    return {
        ...es,
        entityType:entityTypes[est[1]]
    }
  }

  async resolve(req, res) {
    const _p = vault.get(this.uid);
    if (!_p.url && !req.protocol) {
      throw Error('Unable to determine server url from the request or value provided in the ODataServer constructor.')
    }
  
    // If mounted in express, trim off the subpath (req.url) giving us just the base path
    const path = (req.originalUrl || '/').replace(new RegExp(escapeRegExp(req.url) + '$'), '')
    if (!_p.url) { _p.url = (req.protocol + '://' + req.get('host') + path); };

    const context = new Context(this, req);

    res.setHeader('OData-Version', '4.0');
    res.setHeader('DataServiceVersion', '4.0');
    if (_p.cors) { res.setHeader('Access-Control-Allow-Origin', _p.cors); }

    const result = await context.route.resolve(req, res, _p.resolver);

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
    
  }

  getResolver() {
    return (req, res)=>{
      this.resolve(req, res).catch(e=>{

        //this.emit('odata-error', e)
        const error = {
          code:e?.code || 500,
          message: e?.msg || e?.message || "Unknown error",
          stack: e?.stack,
          target: req.url,
          details: []
        }

        res.statusCode = error.code;
        res.setHeader('Content-Type', 'application/json');

        res.end(JSON.stringify({ error }))

      });
    }
  }

  pruneResults(collection, res) {
    prune(this, collection, res)
  }

  base64ToBuffer(collection, doc) {
    const model = this.model
    const entitySet = model.entitySets[collection]
    const entityType = model.entityTypes[entitySet.entityType.replace(model.namespace + '.', '')]
  
    for (const prop in doc) {
      if (!prop) {
        continue
      }
  
      const propDef = entityType[prop]
  
      if (!propDef) {
        continue
      }
  
      if (propDef.type === 'Edm.Binary') {
        doc[prop] = Buffer.from(doc[prop], 'base64')
      }
    }
  }

  bufferToBase64(collection, res) {
    const model = this.model
    const entitySet = model.entitySets[collection]
    const entityType = model.entityTypes[entitySet.entityType.replace(model.namespace + '.', '')]
  
    for (const i in res) {
      const doc = res[i]
      for (const prop in doc) {
        if (!prop) {
          continue
        }
  
        const propDef = entityType[prop]
  
        if (!propDef) {
          continue
        }
  
        if (propDef.type === 'Edm.Binary') {
          // nedb returns object instead of buffer on node 4
          if (!Buffer.isBuffer(doc[prop]) && !doc[prop].length) {
            let obj = doc[prop]
            obj = obj.data || obj
            doc[prop] = Object.keys(obj).map(function (key) { return obj[key] })
          }
  
          // unwrap mongo style buffers
          if (doc[prop]._bsontype === 'Binary') {
            doc[prop] = doc[prop].buffer
          }
  
          doc[prop] = Buffer.from(doc[prop]).toString('base64')
        }
      }
    }
  }

}
