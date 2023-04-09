var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/class/Server.js
import { Buffer as Buffer2 } from "safe-buffer";
import jet7 from "@randajan/jet-core";

// src/tools.js
import jet from "@randajan/jet-core";
var vault = jet.vault("ODataServer");
var escapeRegExp = (str) => str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");

// src/validations/prune.js
var _prune = (doc, model, type) => {
  if (doc instanceof Array) {
    for (const i in doc) {
      _prune(doc[i], model, type);
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
      let complexTypeName = propDef.type.replace("Collection(" + model.namespace + ".", "");
      complexTypeName = complexTypeName.substring(0, complexTypeName.length - 1);
      const complexType = model.complexTypes[complexTypeName];
      if (!complexType) {
        throw new Error(`Complex type ${complexTypeName} was not found.`);
      }
      for (const i in doc[prop]) {
        _prune(doc[prop][i], model, complexType);
      }
      continue;
    }
    if (propDef.type.indexOf("Edm") !== 0) {
      const complexTypeName = propDef.type.replace(model.namespace + ".", "");
      const complexType = model.complexTypes[complexTypeName];
      if (!complexType) {
        throw new Error(`Complex type ${complexTypeName} was not found.`);
      }
      _prune(doc[prop], model, complexType);
    }
  }
};
var prune = ({ model }, collection, docs) => {
  const entitySet = model.entitySets[collection];
  const entityType = model.entityTypes[entitySet.entityType.replace(model.namespace + ".", "")];
  _prune(docs, model, entityType);
};

// src/class/Route.js
import { pathToRegexp } from "path-to-regexp";
import jet2 from "@randajan/jet-core";
var { solid, cached, virtual } = jet2.prop;
var decodeParam = (param) => param && decodeURIComponent(param).replace(/(^["'`]+)|(["'`]+$)/g, "");
var Route = class {
  constructor(method, path, resolve) {
    const keys2 = [];
    solid(this, "resolve", resolve);
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
  test(pathname) {
    return this.regex.test(pathname);
  }
  parseParams(pathname) {
    const { regex, keys: keys2 } = this;
    const ex = regex.exec(pathname);
    if (!ex) {
      return;
    }
    const params = {};
    for (let i = 0; i < keys2.length; i++) {
      solid(params, keys2[i].name, decodeParam(ex[i + 1]));
    }
    return params;
  }
};

// src/methods/resolvers/collections.js
var collections_exports = {};
__export(collections_exports, {
  default: () => collections_default
});
var collections_default = (req, res) => {
  const { model, url } = req.context.server;
  const collections2 = [];
  for (const key in model.entitySets) {
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

// src/methods/resolvers/count.js
var count_exports = {};
__export(count_exports, {
  default: () => count_default
});

// src/methods/resolvers/query.js
var query_exports = {};
__export(query_exports, {
  default: () => query_default
});
import jet3 from "@randajan/jet-core";
var query_default = async (req, res, resolver) => {
  const { context } = req;
  const { server, params: { collection }, options, keys: keys2 } = context;
  const result = await resolver("query", context);
  res.setHeader("Content-Type", "application/json;odata.metadata=minimal");
  let out = {};
  let sAdditionIntoContext = "";
  const oSelect = options.$select;
  if (oSelect) {
    const countProp = Object.keys(oSelect).length;
    let ctr = 1;
    for (const key in oSelect) {
      sAdditionIntoContext += key.toString() + (ctr < countProp ? "," : "");
      ctr++;
    }
  }
  if (!options.$filter._id) {
    sAdditionIntoContext = sAdditionIntoContext.length > 0 ? "(" + sAdditionIntoContext + ")/$entity" : "/$entity";
    out["@odata.context"] = server.url + "/$metadata#" + collection + sAdditionIntoContext;
    if (result.length > 0) {
      for (const key in result[0]) {
        out[key] = result[0][key];
      }
    }
  } else {
    sAdditionIntoContext = sAdditionIntoContext.length > 0 ? "(" + sAdditionIntoContext + ")" : "";
    out = {
      "@odata.context": server.url + "/$metadata#" + collection + sAdditionIntoContext,
      value: result
    };
  }
  if (options.$inlinecount) {
    out["@odata.count"] = result.count;
    out.value = result.value;
  }
  server.pruneResults(collection, out.value);
  server.bufferToBase64(collection, out.value);
  return JSON.stringify(out);
};

// src/methods/resolvers/count.js
import jet4 from "@randajan/jet-core";
var count_default = (req, res) => {
  jet4.prop.solid(req.odata.params, "count", true);
  return query_default(req, res);
};

// src/methods/resolvers/insert.js
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

// src/methods/resolvers/metadata.js
var metadata_exports = {};
__export(metadata_exports, {
  buildMetadata: () => buildMetadata,
  default: () => metadata_default
});
import builder from "xmlbuilder";
var buildMetadata = (model) => {
  const entityTypes = [];
  for (const typeKey in model.entityTypes) {
    const entityType = {
      "@Name": typeKey,
      Property: []
    };
    for (const propKey in model.entityTypes[typeKey]) {
      const property = model.entityTypes[typeKey][propKey];
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
  for (const typeKey in model.complexTypes) {
    const complexType = {
      "@Name": typeKey,
      Property: []
    };
    for (const propKey in model.complexTypes[typeKey]) {
      const property = model.complexTypes[typeKey][propKey];
      complexType.Property.push({ "@Name": propKey, "@Type": property.type });
    }
    complexTypes.push(complexType);
  }
  const container = {
    "@Name": "Context",
    EntitySet: []
  };
  for (const setKey in model.entitySets) {
    container.EntitySet.push({
      "@EntityType": model.entitySets[setKey].entityType,
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
          "@Namespace": model.namespace,
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
  console.log(req.context.server.model);
  const result = buildMetadata(req.context.server.model);
  res.setHeader("Content-Type", "application/xml");
  return result;
};

// src/methods/resolvers/remove.js
var remove_exports = {};
__export(remove_exports, {
  default: () => remove_default
});
var remove_default = async (req, res, resolver) => {
  await resolver("remove", req.context);
};

// src/methods/resolvers/update.js
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
  const query2 = {
    _id: req.params.id.replace(/\"/g, "").replace(/'/g, "")
  };
  const update2 = {
    $set: body
  };
  try {
    cfg.base64ToBuffer(req.params.collection, update2.$set);
    cfg.executeUpdate(req.params.collection, query2, update2, req, (e, entity) => {
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

// import-glob:./resolvers/**
var modules = [collections_exports, count_exports, insert_exports, metadata_exports, query_exports, remove_exports, update_exports];
var __default = modules;
var filenames = ["./resolvers/collections.js", "./resolvers/count.js", "./resolvers/insert.js", "./resolvers/metadata.js", "./resolvers/query.js", "./resolvers/remove.js", "./resolvers/update.js"];

// src/methods/index.js
var _prefix = "./resolvers/";
var _suffix = ".js";
var methods = {};
var methods_default = methods;
filenames.forEach((pathname, index) => {
  const name = pathname.substring(_prefix.length).slice(0, -_suffix.length);
  methods[name] = __default[index].default;
});

// src/class/Context.js
import { parse as parseUrl } from "url";
import jet6 from "@randajan/jet-core";

// src/validations/options.js
import parser from "odata-parser";
import querystring from "querystring";
import jet5 from "@randajan/jet-core";
var { solid: solid2 } = jet5.prop;
var _allowedQueryOptions = ["$", "$expand", "$filter", "$format", "$inlinecount", "$select", "$skip", "$top", "$orderby"];
var filterBug = (val) => Array.isArray(val) && val.length === 2 && val[0] === "null" && val[1] === "" ? null : val;
var parseOp = (op, left, right, func, args) => {
  const r = op || [];
  r.push(parseNode(left, func, args));
  r.push(parseNode(right, func, args));
  return r;
};
var parseSort = (orderBy) => {
  const r = {};
  if (!orderBy) {
    return r;
  }
  for (const prop of orderBy) {
    const propName = Object.keys(prop)[0];
    r[propName] = prop[propName] === "desc" ? -1 : 1;
  }
  return r;
};
var parseSelect = (select) => {
  const r = {};
  if (!select) {
    return r;
  }
  for (const prop of select) {
    r[prop] = 1;
  }
  return r;
};
var parseFilter = (filter) => {
  if (!filter) {
    return {};
  }
  const { type, left, right, func, args } = filter;
  return parseNode({ type, left, right }, func, args);
};
var substringof = (args, result) => {
  const prop = args[0].type === "property" ? args[0] : args[1];
  const lit = args[0].type === "literal" ? args[0] : args[1];
  result[prop.name] = new RegExp(lit.value);
};
var _pushProp = (result, left, rightValue) => {
  if (left.type !== "property" || left.name.indexOf("/") === -1) {
    return result[left.name] = rightValue;
  }
  const fragments = left.name.split("/");
  const obj = result[fragments[0]] || {};
  for (let i = 1; i < fragments.length; i++) {
    if (i === fragments.length - 1) {
      obj[fragments[i]] = rightValue;
    } else {
      obj[fragments[i]] = obj[fragments[i]] || {};
    }
  }
  return result[fragments[0]] = obj;
};
var parseNode = ({ type, left, right }, func, args) => {
  const result = {};
  const pushProp = (rightValue) => _pushProp(result, left, rightValue);
  if (right.type === "literal") {
    if (type === "eq") {
      pushProp(filterBug(right.value));
    }
    if (type === "lt") {
      pushProp({ $lt: right.value });
    }
    if (type === "gt") {
      pushProp({ $gt: right.value });
    }
    if (type === "le") {
      pushProp({ $lte: right.value });
    }
    if (type === "ge") {
      pushProp({ $gte: right.value });
    }
    if (type === "ne") {
      pushProp({ $ne: filterBug(right.value) });
    }
  }
  if (type === "and") {
    result.$and = parseOp(result.$and, left, right, func, args);
  }
  if (type === "or") {
    result.$or = parseOp(result.$or, left, right, func, args);
  }
  if (type === "functioncall") {
    switch (func) {
      case "substringof":
        substringof(args, result);
    }
  }
  return result;
};
var queryTransform = (query2) => {
  if (query2.$top) {
    query2.$limit = query2.$top;
  }
  if (query2.$inlinecount === "allpages") {
    query2.$count = true;
  }
  query2.$sort = parseSort(query2.$orderby);
  query2.$filter = parseFilter(query2.$filter);
  query2.$select = parseSelect(query2.$select);
  return query2;
};
var parseOptions = (url, params) => {
  const query2 = url.query;
  let r = { $filter: {} };
  if (url.search) {
    const queryValid = {};
    for (const opt of _allowedQueryOptions) {
      if (query2[opt]) {
        queryValid[opt] = query2[opt];
      }
    }
    const encodedQS = decodeURIComponent(querystring.stringify(queryValid));
    if (encodedQS) {
      r = queryTransform(parser.parse(encodedQS));
    }
    if (query2.$count) {
      r.$inlinecount = true;
    }
  }
  if (params.count) {
    r.$count = true;
  }
  if (params.id) {
    r.$filter._id = params.id;
  }
  return r;
};

// src/class/Context.js
var { solid: solid3, cached: cached2 } = jet6.prop;
var Context = class {
  constructor(server, req) {
    solid3.all(this, {
      server
    });
    cached2.all(this, {}, {
      method: (_) => req.method.toLowerCase(),
      url: (_) => parseUrl(req.originalUrl || req.url, true),
      route: (_) => server.findRoute(this.method, this.url.pathname),
      params: (_) => this.route.parseParams(this.url.pathname),
      options: (_) => parseOptions(this.url, this.params),
      entity: (_) => server.findEntity(this.params.collection),
      keys: (_) => Object.entries(this.entity.entityType).filter(([k, v]) => v?.key).map(([k]) => k)
    });
    solid3(req, "context", this);
  }
};

// src/class/Server.js
var { query, insert, update, remove, collections, metadata, count } = methods_default;
var { solid: solid4, virtual: virtual2 } = jet7.prop;
var Server = class {
  constructor(config = {}) {
    const { url, model, cors, resolver } = config;
    const [uid, _p] = vault.set({
      url,
      model,
      cors,
      routes: {},
      resolver
    });
    solid4.all(this, {
      uid
    }, false);
    virtual2.all(this, {
      url: (_) => _p.url,
      model: (_) => _p.model
    });
    this.addRoute("get", "/", collections);
    this.addRoute("get", "/$metadata", metadata);
    this.addRoute("get", "/:collection/$count", count);
    this.addRoute("get", "/:collection\\(:id\\)", query);
    this.addRoute("get", "/:collection", query);
    this.addRoute("patch", "/:collection\\(:id\\)", update);
    this.addRoute("delete", "/:collection\\(:id\\)", remove);
    this.addRoute("post", "/:collection", insert);
    if (cors) {
      this.addRoute("options", "/(.*)", () => {
      });
    }
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
      if (route.test(path)) {
        return route;
      }
    }
    throw { code: 404, msg: "Not found" };
  }
  findEntity(name) {
    const { namespace, entitySets, entityTypes } = this.model;
    const es = entitySets[name];
    const est = es ? es.entityType.split(".") : [];
    if (namespace !== est[0]) {
      throw { code: 404, msg: "Entity set not found" };
    }
    return {
      ...es,
      entityType: entityTypes[est[1]]
    };
  }
  async resolve(req, res) {
    const _p = vault.get(this.uid);
    if (!_p.url && !req.protocol) {
      throw Error("Unable to determine server url from the request or value provided in the ODataServer constructor.");
    }
    const path = (req.originalUrl || "/").replace(new RegExp(escapeRegExp(req.url) + "$"), "");
    if (!_p.url) {
      _p.url = req.protocol + "://" + req.get("host") + path;
    }
    ;
    const context = new Context(this, req);
    res.setHeader("OData-Version", "4.0");
    res.setHeader("DataServiceVersion", "4.0");
    if (_p.cors) {
      res.setHeader("Access-Control-Allow-Origin", _p.cors);
    }
    const result = await context.route.resolve(req, res, _p.resolver);
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
    const model = this.model;
    const entitySet = model.entitySets[collection];
    const entityType = model.entityTypes[entitySet.entityType.replace(model.namespace + ".", "")];
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
    const model = this.model;
    const entitySet = model.entitySets[collection];
    const entityType = model.entityTypes[entitySet.entityType.replace(model.namespace + ".", "")];
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

// src/index.js
var src_default = (options) => new Server(options);
export {
  src_default as default
};
//# sourceMappingURL=index.js.map
