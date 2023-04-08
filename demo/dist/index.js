// <define:__slib_info>
var define_slib_info_default = { isProd: false, name: "simple-odata-server", description: "OData server with adapter for mongodb and nedb", version: "1.2.2", author: "Jan Randa", env: "dev", mode: "node", port: 4002, dir: { root: "C:\\dev\\lib\\odata-server", dist: "demo/dist" } };

// node_modules/@randajan/simple-lib/dist/chunk-Z4H3NSHL.js
import chalkNative from "chalk";
var chalkProps = Object.getOwnPropertyNames(Object.getPrototypeOf(chalkNative)).filter((v) => v !== "constructor");
var Logger = class extends Function {
  constructor(formater, chalkInit) {
    super();
    const chalk = chalkInit || chalkNative;
    const log2 = (...msgs) => {
      console.log(chalk(formater(msgs)));
    };
    const self = Object.setPrototypeOf(log2.bind(), new.target.prototype);
    for (const prop of chalkProps) {
      Object.defineProperty(self, prop, { get: (_) => new Logger(formater, chalk[prop]), enumerable: false });
    }
    return self;
  }
};
var logger = (...prefixes) => {
  const now = (_) => new Date().toLocaleTimeString("cs-CZ");
  prefixes = prefixes.filter((v) => !!v).join(" ");
  return new Logger((msgs) => `${prefixes} | ${now()} | ${msgs.join(" ")}`);
};

// node_modules/@randajan/simple-lib/dist/chunk-DSETVJ5D.js
var enumerable = true;
var lockObject = (o) => {
  if (typeof o !== "object") {
    return o;
  }
  const r = {};
  for (const i in o) {
    const descriptor = { enumerable };
    let val = o[i];
    if (val instanceof Array) {
      descriptor.get = (_) => [...val];
    } else {
      descriptor.value = lockObject(val);
    }
    Object.defineProperty(r, i, descriptor);
  }
  return r;
};
var info = lockObject(define_slib_info_default);

// node_modules/@randajan/simple-lib/dist/node/index.js
import { parentPort } from "worker_threads";
var log = logger(info.name, info.version, info.env);
parentPort.on("message", (msg) => {
  if (msg === "shutdown") {
    process.exit(0);
  }
});
process.on("uncaughtException", (e) => {
  console.log(e.stack);
});

// dist/index.js
import { parse as parseUrl } from "url";
import { Buffer as Buffer2 } from "safe-buffer";
import jet5 from "@randajan/jet-core";
import jet from "@randajan/jet-core";
import { pathToRegexp } from "path-to-regexp";
import jet2 from "@randajan/jet-core";
import parser from "odata-parser";
import querystring from "querystring";
import jet3 from "@randajan/jet-core";
import jet4 from "@randajan/jet-core";
import builder from "xmlbuilder";
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var vault2 = jet.vault("ODataServer");
var escapeRegExp = (str) => str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
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
var { solid, cached, virtual } = jet2.prop;
var Route = class {
  constructor(method, path, resolver) {
    const keys2 = [];
    solid.all(this, {
      resolver
    }, false);
    cached(this, {}, "regex", (_) => pathToRegexp(path, keys2), false);
    virtual(this, "keys", (_) => {
      this.regex;
      return keys2;
    }, false);
    solid.all(this, {
      method,
      path
    });
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
    const { odata } = req;
    const { url, server: { cors } } = odata;
    const params = this.parseParams(url.pathname);
    if (!params) {
      return false;
    }
    req.params = params;
    solid.all(odata, {
      route: this,
      params
    });
    res.setHeader("OData-Version", "4.0");
    res.setHeader("DataServiceVersion", "4.0");
    if (cors) {
      res.setHeader("Access-Control-Allow-Origin", cors);
    }
    const result = await this.resolver(req, res);
    if (Object.jet.is(result)) {
      res.stateCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result));
    } else if (result) {
      res.stateCode = 200;
      res.end(result);
    } else {
      res.stateCode = 204;
    }
    return true;
  }
};
var collections_exports = {};
__export(collections_exports, {
  default: () => collections_default
});
var collections_default = (req, res) => {
  const { model: model2, url } = req.odata.server;
  const collections2 = [];
  for (const key in model2.entitySets) {
    collections2.push({
      kind: "EntitySet",
      name: key,
      url: key
    });
  }
  return {
    "@odata.context": `${url}/$metadata`,
    value: collections2
  };
};
var count_exports = {};
__export(count_exports, {
  default: () => count_default
});
var query_exports = {};
__export(query_exports, {
  default: () => query_default
});
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
  if (params.count) {
    r.$count = true;
  }
  if (params.id) {
    r.$filter._id = params.id.replace(/["']/g, "");
  }
  return r;
};
var query_default = async (req, res) => {
  const { odata } = req;
  const { server, params, url } = odata;
  const { resolver } = vault2.get(server.uid);
  const { collection } = params;
  if (!server.model.entitySets[collection]) {
    const error = new Error("Entity set not Found");
    error.code = 404;
    res.odataError(error);
    return;
  }
  const queryOptions = parseOptions(url, params);
  solid2(req.odata, "options", queryOptions);
  const result = await resolver("query", req.odata);
  res.setHeader("Content-Type", "application/json;odata.metadata=minimal");
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
    out["@odata.context"] = server.url + "/$metadata#" + collection + sAdditionIntoContext;
    if (result.length > 0) {
      for (const key in result[0]) {
        out[key] = result[0][key];
      }
    }
    out.value = result;
  } else {
    sAdditionIntoContext = sAdditionIntoContext.length > 0 ? "(" + sAdditionIntoContext + ")" : "";
    out = {
      "@odata.context": server.url + "/$metadata#" + collection + sAdditionIntoContext,
      value: result
    };
  }
  if (queryOptions.$inlinecount) {
    out["@odata.count"] = result.count;
    out.value = result.value;
  }
  server.pruneResults(collection, out.value);
  server.bufferToBase64(collection, out.value);
  return JSON.stringify(out);
};
var count_default = (req, res) => {
  jet4.prop.solid(req.odata.params, "count", true);
  return query_default(req, res);
};
var insert_exports = {};
__export(insert_exports, {
  default: () => insert_default
});
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
var insert_default = (server, req, res) => {
  if (req.body) {
    return processBody(req.body, server, req, res);
  }
  let body = "";
  req.on("data", (data) => {
    body += data;
    if (body.length > 1e6) {
      req.connection.destroy();
    }
  });
  req.on("end", () => {
    return processBody(JSON.parse(body), server, req, res);
  });
};
var metadata_exports = {};
__export(metadata_exports, {
  buildMetadata: () => buildMetadata,
  default: () => metadata_default
});
var buildMetadata = (model2) => {
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
var metadata_default = (req, res) => {
  const result = buildMetadata(req.odata.server.model);
  res.setHeader("Content-Type", "application/xml");
  return result;
};
var remove_exports = {};
__export(remove_exports, {
  default: () => remove_default
});
var remove_default = async (req, res) => {
  const { server, params, url } = req.odata;
  const { resolver } = vault.get(server.uid);
  const query22 = {
    _id: req.params.id.replace(/\"/g, "").replace(/'/g, "")
  };
  await resolver("remove", req);
  res.statusCode = 204;
};
var update_exports = {};
__export(update_exports, {
  default: () => update_default
});
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
var update_default = (server, req, res) => {
  if (req.body) {
    return processBody2(req.body, server, req, res);
  }
  let body = "";
  req.on("data", (data) => {
    body += data;
    if (body.length > 1e6) {
      req.connection.destroy();
    }
  });
  req.on("end", () => {
    return processBody2(JSON.parse(body), server, req, res);
  });
};
var modules = [collections_exports, count_exports, insert_exports, metadata_exports, query_exports, remove_exports, update_exports];
var __default = modules;
var filenames = ["./resolvers/collections.js", "./resolvers/count.js", "./resolvers/insert.js", "./resolvers/metadata.js", "./resolvers/query.js", "./resolvers/remove.js", "./resolvers/update.js"];
var _prefix = "./resolvers/";
var _suffix = ".js";
var methods = {};
var methods_default = methods;
filenames.forEach((pathname, index) => {
  const name = pathname.substring(_prefix.length).slice(0, -_suffix.length);
  methods[name] = __default[index].default;
});
var { query, insert, update, remove, collections, metadata, count } = methods_default;
var { solid: solid3, virtual: virtual2 } = jet5.prop;
var Server = class {
  constructor(config = {}) {
    const { url, model: model2, cors, resolver } = config;
    const [uid, _p] = vault2.set({
      url,
      model: model2,
      cors,
      routes: {},
      resolver
    });
    solid3.all(this, {
      uid
    }, false);
    virtual2.all(this, {
      url: (_) => _p.url,
      model: (_) => _p.model,
      cors: (_) => _p.cors
    });
    this.route("get", "/", collections);
    this.route("get", "/$metadata", metadata);
    this.route("get", "/:collection/$count", count);
    this.route("get", "/:collection\\(:id\\)", query);
    this.route("get", "/:collection", query);
    this.route("patch", "/:collection\\(:id\\)", update);
    this.route("delete", "/:collection\\(:id\\)", remove);
    this.route("post", "/:collection", insert);
    if (cors) {
      this.route("options", "/(.*)", () => {
      });
    }
  }
  route(method, path, resolver) {
    const { routes } = vault2.get(this.uid);
    const list = routes[method] || (routes[method] = []);
    const route = new Route(method, path, resolver);
    list.push(route);
    return route;
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
    solid3(req, "odata", solid3.all({}, {
      server: this,
      url: parseUrl(req.originalUrl || req.url, true)
    }));
    const method = req.method.toLowerCase();
    const routes = _p.routes[method] || [];
    for (const route of routes) {
      if (await route.resolve(req, res)) {
        return true;
      }
    }
    throw { code: 404, msg: "Not found" };
  }
  getResolver() {
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
        doc[prop] = Buffer2.from(doc[prop], "base64");
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
          if (!Buffer2.isBuffer(doc[prop]) && !doc[prop].length) {
            let obj = doc[prop];
            obj = obj.data || obj;
            doc[prop] = Object.keys(obj).map(function(key) {
              return obj[key];
            });
          }
          if (doc[prop]._bsontype === "Binary") {
            doc[prop] = doc[prop].buffer;
          }
          doc[prop] = Buffer2.from(doc[prop]).toString("base64");
        }
      }
    }
  }
};
var src_default = (options) => new Server(options);

// dist/adapter/mongo.js
import { ObjectId } from "mongodb";
import jet6 from "@randajan/jet-core";
var { solid: solid4, cached: cached2 } = jet6.prop;
var _convertStringsToObjectIds = (obj) => jet6.map(obj, (val, fullKey, parentKey, key) => {
  return key === "_id" ? ObjectId(val) : val;
}, true);
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
var query2 = async (collection, { options }) => {
  const { $select, $sort, $skip, $limit, $count, $inlinecount, $filter } = _convertStringsToObjectIds(options);
  let qr = collection.find($filter, { projection: $select || {} });
  if ($sort) {
    qr = qr.sort($sort);
  }
  if ($skip) {
    qr = qr.skip($skip);
  }
  if ($limit) {
    qr = qr.limit($limit);
  }
  if ($count) {
    return qr.count();
  }
  const value = await qr.toArray();
  if (!$inlinecount) {
    return value;
  }
  const count2 = await collection.find($filter).count();
  return { count: count2, value };
};
var mongo_default = (getDB) => {
  const _actions = { update: update2, remove: remove2, query: query2, insert: insert2 };
  return async (actionName, context) => {
    const action = _actions[actionName];
    if (!action) {
      throw Error(`Unknown action '${actionName}'`);
    }
    const db = await getDB();
    const collection = db.collection(context.params.collection);
    return action(collection, context);
  };
};

// demo/src/index.js
import { MongoClient } from "mongodb";
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
  const mongo = _mongos[dbUrl] = await MongoClient.connect(dbUrl, options);
  process.on("exit", (_) => mongo.close());
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
http.createServer(mongoApi.getResolver()).listen(1337);
export {
  mongoApi
};
//# sourceMappingURL=index.js.map
