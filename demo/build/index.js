// dist/index.js
import { parse as parseUrl } from "url";
import { EventEmitter } from "events";
import { Buffer } from "safe-buffer";
import jet5 from "@randajan/jet-core";
import jet from "@randajan/jet-core";
import methods from "methods";
import jet4 from "@randajan/jet-core";
import { pathToRegexp } from "path-to-regexp";
import jet2 from "@randajan/jet-core";
import builder from "xmlbuilder";
import parser from "odata-parser";
import querystring from "querystring";
import jet3 from "@randajan/jet-core";
var vault2 = jet.vault("ODataServer");
var escapeRegExp = (str) => str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
var { solid, cached, virtual } = jet2.prop;
var Route = class {
  constructor(router, path, resolver) {
    const keys2 = [];
    solid.all(this, {
      router,
      resolver
    }, false);
    cached(this, {}, "regex", (_) => pathToRegexp(path, keys2), false);
    virtual(this, "keys", (_) => {
      this.regex;
      return keys2;
    }, false);
    solid(this, "path", path);
  }
  decodeParam(param) {
    return param && decodeURIComponent(param);
  }
  parseParams(pathname) {
    const { regex, keys: keys2 } = this;
    const ex = regex.exec(pathname);
    if (!ex) {
      return;
    }
    const params = {};
    for (let i = 0; i < keys2.length; i++) {
      solid(params, keys2[i].name, this.decodeParam(ex[i + 1]));
    }
    return params;
  }
  async resolve(req, res) {
    const params = this.parseParams(req.odata.url.pathname);
    if (!params) {
      return false;
    }
    req.params = params;
    solid.all(req.odata, {
      route: this,
      params
    });
    this.addCorsToResponse(res);
    const result = await this.resolver(req, res);
    res.end(result);
    return true;
  }
  addCorsToResponse(res) {
    const cors = this.router.ods.cors;
    if (cors) {
      res.setHeader("Access-Control-Allow-Origin", cors);
    }
  }
};
var buildMetadata = ({ model: model2 }) => {
  const entityTypes = [];
  for (const typeKey in model2.entityTypes) {
    const entityType = {
      "@Name": typeKey,
      Property: []
    };
    for (const propKey in model2.entityTypes[typeKey]) {
      const property = model2.entityTypes[typeKey][propKey];
      const finalObject = { "@Name": propKey, "@Type": property.type };
      if (Object.prototype.hasOwnProperty.call(property, "nullable")) {
        finalObject["@Nullable"] = property.nullable;
      }
      entityType.Property.push(finalObject);
      if (property.key) {
        entityType.Key = {
          PropertyRef: {
            "@Name": propKey
          }
        };
      }
    }
    entityTypes.push(entityType);
  }
  const complexTypes = [];
  for (const typeKey in model2.complexTypes) {
    const complexType = {
      "@Name": typeKey,
      Property: []
    };
    for (const propKey in model2.complexTypes[typeKey]) {
      const property = model2.complexTypes[typeKey][propKey];
      complexType.Property.push({ "@Name": propKey, "@Type": property.type });
    }
    complexTypes.push(complexType);
  }
  const container = {
    "@Name": "Context",
    EntitySet: []
  };
  for (const setKey in model2.entitySets) {
    container.EntitySet.push({
      "@EntityType": model2.entitySets[setKey].entityType,
      "@Name": setKey
    });
  }
  const returnObject = {
    "edmx:Edmx": {
      "@xmlns:edmx": "http://docs.oasis-open.org/odata/ns/edmx",
      "@Version": "4.0",
      "edmx:DataServices": {
        Schema: {
          "@xmlns": "http://docs.oasis-open.org/odata/ns/edm",
          "@Namespace": model2.namespace,
          EntityType: entityTypes,
          EntityContainer: container
        }
      }
    }
  };
  if (complexTypes.length) {
    returnObject["edmx:Edmx"]["edmx:DataServices"].Schema.ComplexType = complexTypes;
  }
  return builder.create(returnObject).end({ pretty: true });
};
var getCollections = (ods) => {
  const collections = [];
  for (const key in ods.model.entitySets) {
    collections.push({
      kind: "EntitySet",
      name: key,
      url: key
    });
  }
  return JSON.stringify({
    "@odata.context": `${ods.url}/$metadata`,
    value: collections
  });
};
var substringof = (node, result) => {
  const prop = node.args[0].type === "property" ? node.args[0] : node.args[1];
  const lit = node.args[0].type === "literal" ? node.args[0] : node.args[1];
  result[prop.name] = new RegExp(lit.value);
};
var Node = class {
  constructor(type, left, right, func, args) {
    this.type = type;
    this.left = left;
    this.right = right;
    this.func = func;
    this.args = args;
  }
  _prop(result, left, rightValue) {
    if (left.type === "property" && left.name.indexOf("/") !== -1) {
      const fragments = left.name.split("/");
      const obj = result[fragments[0]] || {};
      for (let i = 1; i < fragments.length; i++) {
        if (i === fragments.length - 1) {
          obj[fragments[i]] = rightValue;
        } else {
          obj[fragments[i]] = obj[fragments[i]] || {};
        }
      }
      result[fragments[0]] = obj;
    } else {
      result[left.name] = rightValue;
    }
  }
  transform() {
    const result = {};
    if (this.type === "eq" && this.right.type === "literal") {
      if (Array.isArray(this.right.value) && this.right.value.length === 2 && this.right.value[0] === "null" && this.right.value[1] === "") {
        this._prop(result, this.left, null);
      } else {
        this._prop(result, this.left, this.right.value);
      }
    }
    if (this.type === "lt" && this.right.type === "literal") {
      this._prop(result, this.left, { $lt: this.right.value });
    }
    if (this.type === "gt" && this.right.type === "literal") {
      this._prop(result, this.left, { $gt: this.right.value });
    }
    if (this.type === "le" && this.right.type === "literal") {
      this._prop(result, this.left, { $lte: this.right.value });
    }
    if (this.type === "ge" && this.right.type === "literal") {
      this._prop(result, this.left, { $gte: this.right.value });
    }
    if (this.type === "ne" && this.right.type === "literal") {
      if (Array.isArray(this.right.value) && this.right.value.length === 2 && this.right.value[0] === "null" && this.right.value[1] === "") {
        this._prop(result, this.left, { $ne: null });
      } else {
        this._prop(result, this.left, { $ne: this.right.value });
      }
    }
    if (this.type === "and") {
      result.$and = result.$and || [];
      result.$and.push(new Node(this.left.type, this.left.left, this.left.right, this.func, this.args).transform());
      result.$and.push(new Node(this.right.type, this.right.left, this.right.right, this.func, this.args).transform());
    }
    if (this.type === "or") {
      result.$or = result.$or || [];
      result.$or.push(new Node(this.left.type, this.left.left, this.left.right, this.func, this.args).transform());
      result.$or.push(new Node(this.right.type, this.right.left, this.right.right, this.func, this.args).transform());
    }
    if (this.type === "functioncall") {
      switch (this.func) {
        case "substringof":
          substringof(this, result);
      }
    }
    return result;
  }
};
var queryTransform = (query22) => {
  if (query22.$filter) {
    query22.$filter = new Node(query22.$filter.type, query22.$filter.left, query22.$filter.right, query22.$filter.func, query22.$filter.args).transform();
  } else {
    query22.$filter = {};
  }
  if (query22.$top) {
    query22.$limit = query22.$top;
  }
  if (query22.$orderby) {
    query22.$sort = {};
    query22.$orderby.forEach(function(prop) {
      const propName = Object.keys(prop)[0];
      query22.$sort[propName] = prop[propName] === "desc" ? -1 : 1;
    });
  }
  if (query22.$inlinecount === "allpages") {
    query22.$count = true;
  }
  const select = {};
  for (const key in query22.$select || []) {
    select[query22.$select[key]] = 1;
  }
  query22.$select = select;
  return query22;
};
var { solid: solid2 } = jet3.prop;
var _allowedQueryOptions = ["$", "$expand", "$filter", "$format", "$inlinecount", "$select", "$skip", "$top", "$orderby"];
var parseOptions = (url, params) => {
  const query22 = url.query;
  let r = { $filter: {} };
  if (url.search) {
    const queryValid = {};
    for (const opt of _allowedQueryOptions) {
      if (query22[opt]) {
        queryValid[opt] = query22[opt];
      }
    }
    const encodedQS = decodeURIComponent(querystring.stringify(queryValid));
    if (encodedQS) {
      r = queryTransform(parser.parse(encodedQS));
    }
    if (query22.$count) {
      r.$inlinecount = true;
    }
  }
  r.collection = params.collection;
  if (params.id) {
    r.$filter._id = params.id.replace(/["']/g, "");
  }
  return r;
};
var query = async (req, res) => {
  const { ods, params, url } = req.odata;
  const { resolver } = vault2.get(ods.uid);
  const { collection } = params;
  if (!ods.model.entitySets[collection]) {
    const error = new Error("Entity set not Found");
    error.code = 404;
    res.odataError(error);
    return;
  }
  const queryOptions = parseOptions(url, params);
  const result = await resolver("query", req);
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json;odata.metadata=minimal");
  res.setHeader("OData-Version", "4.0");
  let out = {};
  let sAdditionIntoContext = "";
  const oSelect = queryOptions.$select;
  if (oSelect) {
    const countProp = Object.keys(oSelect).length;
    let ctr = 1;
    for (const key in oSelect) {
      sAdditionIntoContext += key.toString() + (ctr < countProp ? "," : "");
      ctr++;
    }
  }
  if (Object.prototype.hasOwnProperty.call(queryOptions.$filter, "_id")) {
    sAdditionIntoContext = sAdditionIntoContext.length > 0 ? "(" + sAdditionIntoContext + ")/$entity" : "/$entity";
    out["@odata.context"] = ods.url + "/$metadata#" + collection + sAdditionIntoContext;
    if (result.length > 0) {
      for (const key in result[0]) {
        out[key] = result[0][key];
      }
    }
    out.value = result;
  } else {
    sAdditionIntoContext = sAdditionIntoContext.length > 0 ? "(" + sAdditionIntoContext + ")" : "";
    out = {
      "@odata.context": ods.url + "/$metadata#" + collection + sAdditionIntoContext,
      value: result
    };
  }
  if (queryOptions.$inlinecount) {
    out["@odata.count"] = result.count;
    out.value = result.value;
  }
  ods.pruneResults(collection, out.value);
  ods.bufferToBase64(collection, out.value);
  return JSON.stringify(out);
};
var keys = (o) => {
  const res = [];
  const k = Object.keys(o);
  for (const i in k) {
    if (k[i].lastIndexOf("@", 0) === 0) {
      res.splice(0, 0, k[i]);
    } else {
      res.push(k[i]);
    }
  }
  return res;
};
var sortProperties = (o) => {
  const res = {};
  const props = keys(o);
  for (let i = 0; i < props.length; i++) {
    res[props[i]] = o[props[i]];
  }
  return res;
};
var removeOdataType = (doc) => {
  if (doc instanceof Array) {
    for (const i in doc) {
      if (typeof doc[i] === "object" && doc[i] !== null) {
        removeOdataType(doc[i]);
      }
    }
  }
  delete doc["@odata.type"];
  for (const prop in doc) {
    if (typeof doc[prop] === "object" && doc[prop] !== null) {
      removeOdataType(doc[prop]);
    }
  }
};
var processBody = (data, { cfg, url }, req, res) => {
  try {
    removeOdataType(data);
    cfg.base64ToBuffer(req.params.collection, data);
    cfg.executeInsert(req.params.collection, data, req, (err, entity) => {
      if (err) {
        return res.odataError(err);
      }
      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false;charset=utf-8");
      res.setHeader("OData-Version", "4.0");
      res.setHeader("Location", url + "/" + req.params.collection + "/('" + encodeURI(entity._id) + "')");
      cfg.pruneResults(req.params.collection, entity);
      entity["@odata.id"] = url + "/" + req.params.collection + "('" + entity._id + "')";
      entity["@odata.editLink"] = url + "/" + req.params.collection + "('" + entity._id + "')";
      entity["@odata.context"] = url + "/$metadata#" + req.params.collection + "/$entity";
      entity = sortProperties(entity);
      cfg.bufferToBase64(req.params.collection, [entity]);
      return JSON.stringify(entity);
    });
  } catch (e) {
    res.odataError(e);
  }
};
var insert = (ods, req, res) => {
  if (req.body) {
    return processBody(req.body, ods, req, res);
  }
  let body = "";
  req.on("data", (data) => {
    body += data;
    if (body.length > 1e6) {
      req.connection.destroy();
    }
  });
  req.on("end", () => {
    return processBody(JSON.parse(body), ods, req, res);
  });
};
var removeOdataType2 = (doc) => {
  if (doc instanceof Array) {
    for (const i in doc) {
      if (typeof doc[i] === "object" && doc[i] !== null) {
        removeOdataType2(doc[i]);
      }
    }
  }
  delete doc["@odata.type"];
  for (const prop in doc) {
    if (typeof doc[prop] === "object" && doc[prop] !== null) {
      removeOdataType2(doc[prop]);
    }
  }
};
var processBody2 = (body, { cfg }, req, res) => {
  removeOdataType2(body);
  const query22 = {
    _id: req.params.id.replace(/\"/g, "").replace(/'/g, "")
  };
  const update22 = {
    $set: body
  };
  try {
    cfg.base64ToBuffer(req.params.collection, update22.$set);
    cfg.executeUpdate(req.params.collection, query22, update22, req, (e, entity) => {
      if (e) {
        return res.odataError(e);
      }
      res.statusCode = 204;
    });
  } catch (e) {
    res.odataError(e);
  }
};
var update = (ods, req, res) => {
  if (req.body) {
    return processBody2(req.body, ods, req, res);
  }
  let body = "";
  req.on("data", (data) => {
    body += data;
    if (body.length > 1e6) {
      req.connection.destroy();
    }
  });
  req.on("end", () => {
    return processBody2(JSON.parse(body), ods, req, res);
  });
};
var remove = async (req, res) => {
  const { ods, params, url } = req.odata;
  const { resolver } = vault.get(ods.uid);
  const query22 = {
    _id: req.params.id.replace(/\"/g, "").replace(/'/g, "")
  };
  await resolver("remove", req);
  res.statusCode = 204;
};
var { solid: solid3, virtual: virtual2 } = jet4.prop;
var Router = class {
  constructor(ods, prefix) {
    solid3.all(this, {
      ods
    }, false);
    solid3.all(this, {
      prefix,
      routes: {}
    });
    this.get("/", (req, res) => {
      const result = getCollections(ods);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      return result;
    });
    this.get("/$metadata", (req, res) => {
      const result = buildMetadata(ods.cfg);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/xml");
      res.setHeader("DataServiceVersion", "4.0");
      res.setHeader("OData-Version", "4.0");
      return result;
    });
    this.get("/:collection/$count", (req, res) => {
      solid3(req.odata.params, "$count", true);
      return query(req, res);
    });
    this.get("/:collection\\(:id\\)", query);
    this.get("/:collection", query);
    this.patch("/:collection\\(:id\\)", (req, res) => {
      return update(ods, req, res);
    });
    this.delete("/:collection\\(:id\\)", remove);
    this.post("/:collection", (req, res) => {
      return insert(ods, req, res);
    });
    if (ods.cors) {
      this.options("/(.*)", (req, res) => {
        res.statusCode = 200;
        res.setHeader("Access-Control-Allow-Origin", ods.cors);
      });
    }
  }
  async dispatch(req, res) {
    const method = req.method.toLowerCase();
    for (const route of this.routes[method]) {
      if (await route.resolve(req, res)) {
        return true;
      }
    }
    throw Error({ code: 404, msg: "Not found" });
  }
};
methods.forEach((method) => {
  Router.prototype[method] = function(path, exe) {
    const list = this.routes[method] || (this.routes[method] = []);
    const route = new Route(this, path, exe);
    list.push(route);
    return route;
  };
});
var _prune = (doc, model2, type) => {
  if (doc instanceof Array) {
    for (const i in doc) {
      _prune(doc[i], model2, type);
    }
    return;
  }
  for (const prop in doc) {
    if (!prop || doc[prop] === void 0 || prop.toString().substring(0, 6) === "@odata") {
      continue;
    }
    const propDef = type[prop];
    if (!propDef) {
      delete doc[prop];
      continue;
    }
    if (propDef.type.indexOf("Collection") === 0) {
      if (propDef.type.indexOf("Collection(Edm") === 0) {
        continue;
      }
      let complexTypeName = propDef.type.replace("Collection(" + model2.namespace + ".", "");
      complexTypeName = complexTypeName.substring(0, complexTypeName.length - 1);
      const complexType = model2.complexTypes[complexTypeName];
      if (!complexType) {
        throw new Error(`Complex type ${complexTypeName} was not found.`);
      }
      for (const i in doc[prop]) {
        _prune(doc[prop][i], model2, complexType);
      }
      continue;
    }
    if (propDef.type.indexOf("Edm") !== 0) {
      const complexTypeName = propDef.type.replace(model2.namespace + ".", "");
      const complexType = model2.complexTypes[complexTypeName];
      if (!complexType) {
        throw new Error(`Complex type ${complexTypeName} was not found.`);
      }
      _prune(doc[prop], model2, complexType);
    }
  }
};
var prune = ({ model: model2 }, collection, docs) => {
  const entitySet = model2.entitySets[collection];
  const entityType = model2.entityTypes[entitySet.entityType.replace(model2.namespace + ".", "")];
  _prune(docs, model2, entityType);
};
var { solid: solid4, virtual: virtual3 } = jet5.prop;
var ODataServer = class extends EventEmitter {
  constructor(config = {}) {
    super();
    const { url, model: model2, cors, resolver } = config;
    const [uid, _p] = vault2.set({
      url,
      model: model2,
      cors,
      routers: {},
      resolver
    });
    solid4.all(this, {
      uid
    }, false);
    virtual3.all(this, {
      url: (_) => _p.url,
      model: (_) => _p.model,
      cors: (_) => _p.cors
    });
    this.cfg = {
      afterRead: function() {
      },
      beforeQuery: function(col, query22, req, cb) {
        cb();
      },
      executeQuery: ODataServer.prototype.executeQuery.bind(this),
      beforeInsert: function(col, query22, req, cb) {
        cb();
      },
      executeInsert: ODataServer.prototype.executeInsert.bind(this),
      beforeUpdate: function(col, query22, update22, req, cb) {
        cb();
      },
      executeUpdate: ODataServer.prototype.executeUpdate.bind(this),
      beforeRemove: function(col, query22, req, cb) {
        cb();
      },
      executeRemove: ODataServer.prototype.executeRemove.bind(this),
      base64ToBuffer: ODataServer.prototype.base64ToBuffer.bind(this),
      bufferToBase64: ODataServer.prototype.bufferToBase64.bind(this),
      pruneResults: ODataServer.prototype.pruneResults.bind(this)
    };
  }
  async resolve(req, res) {
    const _p = vault2.get(this.uid);
    if (!_p.url && !req.protocol) {
      throw Error("Unable to determine server url from the request or value provided in the ODataServer constructor.");
    }
    const path = (req.originalUrl || "/").replace(new RegExp(escapeRegExp(req.url) + "$"), "");
    if (!_p.url) {
      _p.url = req.protocol + "://" + req.get("host") + path;
    }
    ;
    const prefix = parseUrl(_p.url).pathname;
    const router = _p.routers[prefix] || (_p.routers[prefix] = new Router(this, prefix));
    solid4(req, "odata", solid4.all({}, {
      ods: this,
      router,
      url: parseUrl(req.originalUrl || req.url, true)
    }));
    return router.dispatch(req, res);
  }
  getHandler() {
    return (req, res) => {
      this.resolve(req, res).catch((e) => {
        const error = {
          code: e?.code || 500,
          message: e?.msg || e?.message || "Unknown error",
          stack: e?.stack,
          target: req.url,
          details: []
        };
        res.statusCode = error.code;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error }));
      });
    };
  }
  insert(fn) {
    this.cfg.insert = fn.bind(this);
    return this;
  }
  beforeInsert(fn) {
    if (fn.length === 3) {
      console.warn("Listener function should accept request parameter.");
      const origFn = fn;
      fn = function(col, doc, req, cb) {
        origFn(col, doc, cb);
      };
    }
    this.cfg.beforeInsert = fn.bind(this);
    return this;
  }
  executeInsert(col, doc, req, cb) {
    const self = this;
    this.cfg.beforeInsert(col, doc, req, function(err) {
      if (err) {
        return cb(err);
      }
      self.cfg.insert(col, doc, req, cb);
    });
  }
  update(fn) {
    this.cfg.update = fn.bind(this);
    return this;
  }
  beforeUpdate(fn) {
    if (fn.length === 4) {
      console.warn("Listener function should accept request parameter.");
      const origFn = fn;
      fn = function(col, query22, update22, req, cb) {
        origFn(col, query22, update22, cb);
      };
    }
    this.cfg.beforeUpdate = fn.bind(this);
    return this;
  }
  executeUpdate(col, query22, update22, req, cb) {
    const self = this;
    this.cfg.beforeUpdate(col, query22, update22, req, function(err) {
      if (err) {
        return cb(err);
      }
      self.cfg.update(col, query22, update22, req, cb);
    });
  }
  remove(fn) {
    this.cfg.remove = fn.bind(this);
    return this;
  }
  beforeRemove(fn) {
    if (fn.length === 3) {
      console.warn("Listener function should accept request parameter.");
      const origFn = fn;
      fn = function(col, query22, req, cb) {
        origFn(col, query22, cb);
      };
    }
    this.cfg.beforeRemove = fn.bind(this);
    return this;
  }
  executeRemove(col, query22, req, cb) {
    const self = this;
    this.cfg.beforeRemove(col, query22, req, function(err) {
      if (err) {
        return cb(err);
      }
      self.cfg.remove(col, query22, req, cb);
    });
  }
  afterRead(fn) {
    this.cfg.afterRead = fn;
    return this;
  }
  pruneResults(collection, res) {
    prune(this, collection, res);
  }
  base64ToBuffer(collection, doc) {
    const model2 = this.model;
    const entitySet = model2.entitySets[collection];
    const entityType = model2.entityTypes[entitySet.entityType.replace(model2.namespace + ".", "")];
    for (const prop in doc) {
      if (!prop) {
        continue;
      }
      const propDef = entityType[prop];
      if (!propDef) {
        continue;
      }
      if (propDef.type === "Edm.Binary") {
        doc[prop] = Buffer.from(doc[prop], "base64");
      }
    }
  }
  bufferToBase64(collection, res) {
    const model2 = this.model;
    const entitySet = model2.entitySets[collection];
    const entityType = model2.entityTypes[entitySet.entityType.replace(model2.namespace + ".", "")];
    for (const i in res) {
      const doc = res[i];
      for (const prop in doc) {
        if (!prop) {
          continue;
        }
        const propDef = entityType[prop];
        if (!propDef) {
          continue;
        }
        if (propDef.type === "Edm.Binary") {
          if (!Buffer.isBuffer(doc[prop]) && !doc[prop].length) {
            let obj = doc[prop];
            obj = obj.data || obj;
            doc[prop] = Object.keys(obj).map(function(key) {
              return obj[key];
            });
          }
          if (doc[prop]._bsontype === "Binary") {
            doc[prop] = doc[prop].buffer;
          }
          doc[prop] = Buffer.from(doc[prop]).toString("base64");
        }
      }
    }
  }
};
var src_default = (options) => new ODataServer(options);

// dist/adapter/mongo.js
import { MongoClient, ObjectId } from "mongodb";
import jet6 from "@randajan/jet-core";
var { solid: solid5, cached: cached2 } = jet6.prop;
var update2 = async (collection, { query: query22, data }) => {
  if (data.$set) {
    delete data.$set._id;
  }
  const res = await collection.updateOne(query22, data);
  if (res.matchedCount !== 1) {
    throw Error("Update not successful");
  }
  return res.matchedCount;
};
var remove2 = async (collection, { query: query22 }) => {
  const res = await collection.deleteOne(query22);
  if (res.deletedCount !== 1) {
    throw Error("Remove not successful");
  }
  return res.deletedCount;
};
var insert2 = async (collection, { data }) => {
  const value = await collection.insertOne(data);
  return collection.findOne({ _id: value.insertedId });
};
var query2 = async (collection, { query: query22 }) => {
  let qr = collection.find(query22.$filter, { projection: query22.$select || {} });
  if (query22.$sort) {
    qr = qr.sort(query22.$sort);
  }
  if (query22.$skip) {
    qr = qr.skip(query22.$skip);
  }
  if (query22.$limit) {
    qr = qr.limit(query22.$limit);
  }
  if (query22.$count) {
    return qr.count();
  }
  const value = await qr.toArray();
  if (!query22.$inlinecount) {
    return value;
  }
  const count = await collection.find(query22.$filter).count();
  return { count, value };
};
var _methods = { update: update2, remove: remove2, query: query2, insert: insert2 };
var mongo_default = (getDB) => {
  return async (methodName, req) => {
    const method = _methods[methodName];
    if (!method) {
      throw Error(`Unknown method '${methodName}'`);
    }
    const db = await getDB();
  };
};

// demo/src/index.js
import { MongoClient as MongoClient2 } from "mongodb";
import http from "http";
var _mongos = {};
var _protocolSuffix = /:\/\//;
var getMongo = async (dbUrl, options) => {
  dbUrl = dbUrl || "localhost:27017";
  if (!_protocolSuffix.test(dbUrl)) {
    dbUrl = "mongodb://" + dbUrl;
  }
  if (_mongos[dbUrl]) {
    return _mongos[dbUrl];
  }
  const mongo = _mongos[dbUrl] = await MongoClient2.connect(dbUrl, options);
  mongo.on("close", (_) => {
    delete _mongos[dbUrl];
  });
  return mongo;
};
var model = {
  namespace: "piapmo",
  entityTypes: {
    "UserType": {
      "_id": { "type": "Edm.String", key: true },
      "test": { "type": "Edm.String" }
    },
    "DebugRequestType": {
      "at": { "type": "Edm.DateTime" },
      "method": { "type": "Edm.String" },
      "path": { "type": "Edm.String" },
      "query": { "type": "Edm.String" },
      "headers": { "type": "Edm.String" },
      "body": { "type": "Edm.String" }
    }
  },
  entitySets: {
    "users": {
      entityType: "piapmo.UserType"
    },
    "_debug_requests": {
      entityType: "piapmo.DebugRequestType"
    }
  }
};
var mongoApi = src_default({
  url: "http://localhost:1337",
  model,
  resolver: mongo_default(async (_) => (await getMongo()).db("piapmo"))
});
http.createServer(mongoApi.getHandler()).listen(1337);
export {
  mongoApi
};
//# sourceMappingURL=index.js.map
