import { parse as parseUrl } from "url";
import { Buffer } from "safe-buffer";
import jet from "@randajan/jet-core";

import { escapeRegExp, vault } from "../tools";

import { prune } from '../validations/prune.js';
import { Route } from "./Route";

import methods from "../methods";

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
      model:_=>_p.model,
      cors:_=>_p.cors
    });

    this.route("get", '/', collections);
    this.route("get", '/\$metadata', metadata);

    this.route("get", '/:collection/\$count', count);
    this.route("get", '/:collection\\(:id\\)', query);
    this.route("get", '/:collection', query);

    this.route("patch", '/:collection\\(:id\\)', update);
    this.route("delete", '/:collection\\(:id\\)', remove);
    this.route("post", '/:collection', insert);

    if (cors) { this.route("options", '/(.*)', ()=>{}); }

  }

  route(method, path, resolver) {
    const { routes } = vault.get(this.uid);
    const list = routes[method] || (routes[method] = []);
    const route = new Route(method, path, resolver);
    list.push(route);
    return route;
  }

  async resolve(req, res) {
    const _p = vault.get(this.uid);
    if (!_p.url && !req.protocol) {
      throw Error('Unable to determine server url from the request or value provided in the ODataServer constructor.')
    }
  
    // If mounted in express, trim off the subpath (req.url) giving us just the base path
    const path = (req.originalUrl || '/').replace(new RegExp(escapeRegExp(req.url) + '$'), '')
    if (!_p.url) { _p.url = (req.protocol + '://' + req.get('host') + path); };

    solid(req, "odata", solid.all({}, { //create custom context space at request
      server:this,
      url:parseUrl(req.originalUrl || req.url, true)
    })); 
    
    const method = req.method.toLowerCase();
    const routes = _p.routes[method] || [];

    for (const route of routes) {
      if (await route.resolve(req, res)) { return true; }
    }

    throw { code: 404, msg: "Not found" };
    
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
