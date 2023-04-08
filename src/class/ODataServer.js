import { parse as parseUrl } from "url";
import { EventEmitter } from "events";
import { Buffer } from "safe-buffer";
import jet from "@randajan/jet-core";

import { escapeRegExp, vault } from "../tools";


import { Router } from "./Router";
import { prune } from '../validations/prune.js';



const { solid, virtual } = jet.prop;

export class ODataServer extends EventEmitter {
  constructor(config={}) {
    super();

    const { url, model, cors, resolver } = config;

    const [ uid, _p ] = vault.set({
      url,
      model,
      cors,
      routers:{},
      resolver

    });

    solid.all(this, {
      uid
    }, false);

    virtual.all(this, {
      url:_=>_p.url,
      model:_=>_p.model,
      cors:_=>_p.cors
    })

  }

  async resolve(req, res) {
    const _p = vault.get(this.uid);
    if (!_p.url && !req.protocol) {
      throw Error('Unable to determine server url from the request or value provided in the ODataServer constructor.')
    }
  
    // If mounted in express, trim off the subpath (req.url) giving us just the base path
    const path = (req.originalUrl || '/').replace(new RegExp(escapeRegExp(req.url) + '$'), '')
    if (!_p.url) { _p.url = (req.protocol + '://' + req.get('host') + path); };
  
    const prefix = parseUrl(_p.url).pathname;
    const router = _p.routers[prefix] || (_p.routers[prefix] = new Router(this, prefix)); //cache routers

    solid(req, "odata", solid.all({}, { //create custom context space at request
      ods:this,
      router,
      url:parseUrl(req.originalUrl || req.url, true)
    })); 
    
    return router.dispatch(req, res);
  }

  getHandler() {
    return (req, res)=>{
      this.resolve(req, res).catch(e=>{

        //ods.emit('odata-error', e)
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
