var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/class/Server.js
import { Buffer as Buffer2 } from "safe-buffer";
import jet13 from "@randajan/jet-core";

// src/tools.js
import jet from "@randajan/jet-core";
var vault = jet.vault("ODataServer");
var escapeRegExp = (str) => str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
var withBrackets = (val, quote = "") => {
  const str = String.jet.to(val, quote + "," + quote);
  return str ? "(" + quote + str + quote + ")" : "";
};
var getScope = (collection, ids, quote = "") => collection + withBrackets(ids, quote);
var getScopeMeta = (collection, ids, quote = "") => "$metadata#" + getScope(collection, ids, quote);
var isWrapped = (str, prefix = "", suffix = "") => typeof str === "string" ? str.startsWith(prefix) && str.endsWith(suffix) : false;
var unwrap = (str, prefix = "", suffix = "") => isWrapped(str = String.jet.to(str), prefix, suffix) ? str.slice(prefix.length, str.length - suffix.length) : "";

// src/class/Route.js
import { pathToRegexp } from "path-to-regexp";
import jet4 from "@randajan/jet-core";

// src/actions/resolvers/collections.js
var collections_exports = {};
__export(collections_exports, {
  default: () => collections_default
});
var collections_default = async (req, res) => {
  const { model, url } = req.context.server;
  const collections = [];
  for (const key in model.entitySets) {
    collections.push({
      kind: "EntitySet",
      name: key,
      url: key
    });
  }
  const out = {
    "@odata.context": `${url}/$metadata`,
    value: collections
  };
  res.setHeader("Content-Type", "application/json");
  res.stateCode = 200;
  res.end(JSON.stringify(out));
};

// src/actions/resolvers/count.js
var count_exports = {};
__export(count_exports, {
  default: () => count_default
});

// src/actions/resolvers/query.js
var query_exports = {};
__export(query_exports, {
  default: () => query_default
});
import jet2 from "@randajan/jet-core";
var query_default = async (req, res, raw) => {
  const { context } = req;
  const { options: { $select, $filter, $inlinecount }, entity: { primaryKey, props } } = context;
  let out = {};
  if ($filter.hasOwnProperty(primaryKey)) {
    out["@odata.context"] = context.getScopeMetaEntity($select ? Object.keys($select) : "");
    if (raw.length) {
      Object.assign(out, props.toResponse(raw[0]));
    }
  } else {
    out["@odata.context"] = context.getScopeMeta($select ? Object.keys($select) : "");
    out.value = props.toResponse(raw, false);
  }
  if ($inlinecount) {
    out["@odata.count"] = raw.count;
    out.value = raw.value;
  }
  res.setHeader("Content-Type", "application/json;odata.metadata=minimal");
  res.stateCode = 200;
  res.end(JSON.stringify(out));
};

// src/actions/resolvers/count.js
import jet3 from "@randajan/jet-core";
var count_default = async (req, res) => {
  jet3.prop.solid(req.context.params, "count", true);
  return query_default(req, res);
};

// src/actions/resolvers/insert.js
var insert_exports = {};
__export(insert_exports, {
  default: () => insert_default
});
var sortProperties = (obj) => {
  const sortedKeys = Object.keys(obj).sort((a, b) => a.startsWith("@") ? -1 : b.startsWith("@") ? 1 : 0);
  const sortedObj = {};
  for (const key of sortedKeys) {
    sortedObj[key] = obj[key];
  }
  return sortedObj;
};
var insert_default = async (req, res, raw) => {
  const { context } = req;
  const { props, primaryKey } = context.entity;
  let out = props.toResponse(raw);
  const id = out[primaryKey];
  out["@odata.id"] = out["@odata.editLink"] = context.getScope(id, "'");
  out["@odata.context"] = context.getScopeMetaEntity();
  out = sortProperties(out);
  res.setHeader("Content-Type", "application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false;charset=utf-8");
  res.setHeader("Location", context.getScope(encodeURI(id), "'"));
  res.statusCode = 201;
  res.end(JSON.stringify(out));
};

// src/actions/resolvers/metadata.js
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
var metadata_default = async (req, res) => {
  const out = buildMetadata(req.context.server.model);
  res.setHeader("Content-Type", "application/xml");
  res.stateCode = 200;
  res.end(out);
};

// src/actions/resolvers/remove.js
var remove_exports = {};
__export(remove_exports, {
  default: () => remove_default
});
var remove_default = async (req, res, raw) => {
  res.stateCode = 204;
  res.end();
};

// src/actions/resolvers/update.js
var update_exports = {};
__export(update_exports, {
  default: () => update_default
});
var update_default = async (req, res, raw) => {
  res.stateCode = 204;
  res.end();
};

// import-glob:./resolvers/**
var modules = [collections_exports, count_exports, insert_exports, metadata_exports, query_exports, remove_exports, update_exports];
var __default = modules;
var filenames = ["./resolvers/collections.js", "./resolvers/count.js", "./resolvers/insert.js", "./resolvers/metadata.js", "./resolvers/query.js", "./resolvers/remove.js", "./resolvers/update.js"];

// src/actions/index.js
var _prefix = "./resolvers/";
var _suffix = ".js";
var methods = {};
var actions_default = methods;
filenames.forEach((pathname, index) => {
  const name = pathname.substring(_prefix.length).slice(0, -_suffix.length);
  methods[name] = __default[index].default;
});

// src/class/Route.js
var { solid, cached, virtual } = jet4.prop;
var decodeParam = (param) => param && decodeURIComponent(param).replace(/(^["'`]+)|(["'`]+$)/g, "");
var Route = class {
  constructor(method, path, action) {
    const keys = [];
    cached(this, {}, "regex", (_) => pathToRegexp(path, keys), false);
    virtual(this, "keys", (_) => {
      this.regex;
      return keys;
    }, false);
    solid.all(this, {
      method,
      path,
      action
    });
    solid(this, "resolver", actions_default[action]);
    if (!this.resolver) {
      throw Error(`Route action '${action}' is not implemented. Available actions: '${Object.keys(actions_default).join(", ")}' `);
    }
  }
  test(pathname) {
    return this.regex.test(pathname);
  }
  parseParams(pathname) {
    const { regex, keys } = this;
    const ex = regex.exec(pathname);
    if (!ex) {
      return;
    }
    const params = {};
    for (let i = 0; i < keys.length; i++) {
      solid(params, keys[i].name, decodeParam(ex[i + 1]));
    }
    return params;
  }
};

// src/class/Context.js
import { parse as parseUrl } from "url";
import jet7 from "@randajan/jet-core";

// src/parsers/options.js
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
var queryTransform = (query) => {
  if (query.$top) {
    query.$limit = query.$top;
  }
  if (query.$inlinecount === "allpages") {
    query.$count = true;
  }
  query.$sort = parseSort(query.$orderby);
  query.$filter = parseFilter(query.$filter);
  query.$select = parseSelect(query.$select);
  return query;
};
var fetchOptions = (url, params, primaryKey) => {
  const query = url.query;
  let r = { $filter: {} };
  if (url.search) {
    const queryValid = {};
    for (const opt of _allowedQueryOptions) {
      if (query[opt]) {
        queryValid[opt] = query[opt];
      }
    }
    const encodedQS = decodeURIComponent(querystring.stringify(queryValid));
    if (encodedQS) {
      r = queryTransform(parser.parse(encodedQS));
    }
    if (query.$count) {
      r.$inlinecount = true;
    }
  }
  if (params.count) {
    r.$count = true;
  }
  if (params.id) {
    r.$filter[primaryKey] = params.id;
  }
  return r;
};

// src/parsers/inputs.js
import jet6 from "@randajan/jet-core";
var fetchBody = async (req) => {
  if (req.body) {
    return req.body;
  }
  return new Promise((res, rej) => {
    let body = "";
    req.on("data", (data) => {
      if ((body += data).length > 1e6) {
        rej({ code: 400, msg: "Request is too long" });
      }
    });
    req.on("end", (_) => {
      try {
        res(JSON.parse(body));
      } catch (e) {
        rej({ code: 400, msg: e.message });
      }
    });
  });
};

// src/class/Context.js
var { solid: solid3, cached: cached2 } = jet7.prop;
var Context = class {
  constructor(server, req) {
    solid3(this, "server", server);
    cached2.all(this, {}, {
      method: (_) => req.method.toLowerCase(),
      url: (_) => parseUrl(req.originalUrl || req.url, true),
      route: (_) => server.findRoute(this.method, this.url.pathname),
      params: (_) => this.route.parseParams(this.url.pathname),
      entity: (_) => server.model.entitySets[this.params.collection],
      options: (_) => fetchOptions(this.url, this.params, this.entity.primaryKey)
    });
    let body;
    solid3(this, "getBody", async (isOne = true) => this.entity.props.toAdapter(body || (body = await fetchBody(req)), isOne));
    solid3(req, "context", this);
  }
  getScope(ids, quote = "") {
    const { server: { url }, params: { collection } } = this;
    return url + "/" + getScope(collection, ids, quote);
  }
  getScopeMeta(ids, quote = "") {
    const { server: { url }, params: { collection } } = this;
    return url + "/" + getScopeMeta(collection, ids, quote);
  }
  getScopeMetaEntity(ids, quote = "") {
    return this.getScopeMeta(ids, quote) + "/$entity";
  }
};

// src/class/Model.js
import jet12 from "@randajan/jet-core";

// src/class/ModelPack.js
import jet8 from "@randajan/jet-core";
var { solid: solid4, cached: cached3 } = jet8.prop;
var validateChildDefault = (parent, name, child) => child;
var ModelPack = class {
  constructor(parent, name, childs, validateChild) {
    const _p = {};
    solid4(this, "name", name, false);
    solid4(this, "parent", parent, false);
    validateChild = validateChild || validateChildDefault;
    childs = Object.jet.to(childs);
    for (let name2 in childs) {
      const child = childs[name2];
      cached3(this, _p, name2, (_) => validateChild(this, name2, child));
    }
  }
  msg(text, ...path) {
    return this.parent.msg(text, this.name, ...path);
  }
  toString() {
    return this.name;
  }
};

// src/class/ModelProp.js
import jet9 from "@randajan/jet-core";

// src/consts.js
var propTypes = [
  "Edm.Int16",
  "Edm.Int32",
  "Edm.Int64",
  "Edm.Boolean",
  "Edm.String",
  "Edm.Date",
  "Edm.Single",
  "Edm.Double",
  "Edm.Decimal",
  "Edm.TimeOfDay",
  "Edm.DateTimeOffset",
  "Edm.Byte",
  "Edm.SByte3",
  "Edm.Binary"
];
var knownActions = [
  "query",
  "count",
  "insert",
  "update",
  "remove"
];

// src/class/ModelProp.js
var { solid: solid5 } = jet9.prop;
var convert = (prop, method, vals, subCollection) => {
  const { isCollection, complex, primitive, name } = prop;
  if (name.startsWith("@odata")) {
    return;
  }
  if (!subCollection && isCollection) {
    return (Array.isArray(vals) ? vals : [vals]).map((v) => convert(prop, method, v, true));
  }
  if (complex) {
    return complex[method](vals);
  }
  return prop.parent.parent.parent.converter[primitive](vals, method);
};
var ModelProp = class extends ModelPack {
  constructor(parent, name, attrs) {
    super(parent, name, attrs);
    const model = parent.parent.parent;
    const namespace = model.namespace;
    const type = this.type;
    if (!type) {
      throw Error(this.msg(`missing!`, "type"));
    }
    const unCollection = unwrap(type, "Collection(", ")");
    solid5(this, "isCollection", !!unCollection);
    const complexName = unwrap(unCollection || type, namespace + ".");
    const complex = model.complexTypes[complexName];
    if (complexName && !complex) {
      throw Error(this.msg(`definition missing at 'model.complexTypes.${complexName}'`, "type"));
    }
    solid5(this, "primitive", complex ? void 0 : unCollection || type);
    solid5(this, "complex", complex);
    if (!complex && !propTypes.includes(this.primitive)) {
      throw Error(this.msg(`invalid value '${this.type}' - accepts one of: '${propTypes.join(", ")}'`, "type"));
    }
  }
  toAdapter(val) {
    return convert(this, "toAdapter", val);
  }
  toResponse(val) {
    return convert(this, "toResponse", val);
  }
};

// src/class/ModelType.js
import jet10 from "@randajan/jet-core";
var convert2 = (type, method, vals, isOne) => {
  vals = !isOne && !Array.isArray(vals) ? [vals] : vals;
  if (!isOne) {
    return vals.map((val) => convert2(type, method, val, true));
  }
  const r = {};
  if (typeof vals === "object") {
    for (let i in vals) {
      const prop = type[i];
      if (!prop) {
        continue;
      }
      const val = prop[method](vals[i]);
      if (val !== void 0) {
        r[i] = val;
      }
    }
  }
  return r;
};
var ModelType = class extends ModelPack {
  toAdapter(vals, isOne = true) {
    return convert2(this, "toAdapter", vals, isOne);
  }
  toResponse(vals, isOne = true) {
    return convert2(this, "toResponse", vals, isOne);
  }
};

// src/class/ModelEntity.js
import jet11 from "@randajan/jet-core";
var { solid: solid6, cached: cached4 } = jet11.prop;
var ModelEntity = class extends ModelPack {
  constructor(parent, name, attrs) {
    super(parent, name, attrs);
    const model = parent.parent;
    const namespace = model.namespace;
    const entityType = this.entityType;
    if (!entityType) {
      throw Error(this.msg(`missing!`, "entityType"));
    }
    const typeName = unwrap(entityType, namespace + ".");
    if (!typeName) {
      throw Error(this.msg(`missing namespace '${namespace}' prefix`, "entityType"));
    }
    const props = model.entityTypes[typeName];
    if (!props) {
      throw Error(this.msg(`definition missing at 'model.entityTypes.${typeName}'`, "entityType"));
    }
    solid6(this, "props", props);
    for (const propName in props) {
      if (!props[propName].key) {
        continue;
      }
      if (this.primaryKey) {
        throw Error(this.msg(`primaryKey is allready defined as ${this.primaryKey}`, propName));
      }
      solid6(this, "primaryKey", propName);
    }
    if (!this.primaryKey) {
      throw Error(this.msg(`primaryKey is missing`));
    }
  }
};

// src/class/Model.js
var { solid: solid7, cached: cached5 } = jet12.prop;
var createProp = (type, name, attrs) => new ModelProp(type, name, attrs);
var createEntity = (sets, name, attrs) => new ModelEntity(sets, name, attrs);
var createType = (types, name, props) => new ModelType(types, name, props, createProp);
var Model = class {
  constructor(server, model, converter) {
    const { namespace, entityTypes, entitySets, complexTypes } = Object.jet.to(model);
    solid7(this, "server", server, false);
    solid7(this, "namespace", String.jet.to(namespace));
    if (!this.namespace) {
      throw Error(this.msg("namespace missing"));
    }
    solid7(this, "complexTypes", new ModelPack(this, "complexTypes", complexTypes, createType));
    solid7(this, "entityTypes", new ModelPack(this, "entityTypes", entityTypes, createType));
    solid7(this, "entitySets", new ModelPack(this, "entitySets", entitySets, createEntity));
    solid7(this, "converter", {}, false);
    const csr = jet12.isRunnable(converter);
    if (!csr) {
      converter = Object.jet.to(converter);
    }
    propTypes.map((t) => {
      const fce = csr ? (v, method) => converter(t, v, method) : jet12.isRunnable(converter[t]) ? converter[t] : (v) => v;
      solid7(this.converter, t, fce);
    });
  }
  msg(text, ...path) {
    path = path.join(".") || "";
    if (path) {
      path = "." + path;
    }
    return this.server.msg("model" + path + " " + text);
  }
  checkNamespace(str) {
    return isWrapped(str, this.namespace + ".");
  }
  stripNamespace(str) {
    return unwrap(str, this.namespace + ".");
  }
};

// src/class/Server.js
var { solid: solid8, virtual: virtual2, cached: cached6 } = jet13.prop;
var Server = class {
  constructor(config = {}) {
    const { url, model, cors, adapter, converter } = config;
    const [uid, _p] = vault.set({
      url,
      cors,
      routes: {},
      adapter
    });
    solid8.all(this, {
      uid
    }, false);
    virtual2.all(this, {
      url: (_) => _p.url,
      resolver: (_) => this.resolve.bind(this)
    });
    cached6(this, _p, "model", (_) => new Model(this, model, converter));
    this.addRoute("get", "/", "collections");
    this.addRoute("get", "/$metadata", "metadata");
    this.addRoute("get", "/:collection/$count", "count");
    this.addRoute("get", "/:collection\\(:id\\)", "query");
    this.addRoute("get", "/:collection", "query");
    this.addRoute("patch", "/:collection\\(:id\\)", "update");
    this.addRoute("delete", "/:collection\\(:id\\)", "remove");
    this.addRoute("post", "/:collection", "insert");
    if (cors) {
      this.addRoute("options", "/(.*)", () => {
      });
    }
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
      if (route.test(path)) {
        return route;
      }
    }
    throw { code: 404, msg: "Not found" };
  }
  async resolve(req, res) {
    try {
      const _p = vault.get(this.uid);
      if (!_p.url && !req.protocol) {
        throw Error(this.text("Unable to determine server url from the request or value provided in the ODataServer constructor."));
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
      const { action, resolver } = context.route;
      if (!knownActions.includes(action)) {
        await resolver(req, res);
        return;
      }
      if (!_p.adapter[action]) {
        throw { code: 501, msg: "Not Implemented" };
      }
      await resolver(req, res, await _p.adapter[action](context));
    } catch (e) {
      const error = {
        code: e?.code || 500,
        message: e?.msg || e?.message || "Unknown error",
        stack: e?.stack,
        method: req.method,
        target: req.url,
        details: []
      };
      res.statusCode = error.code;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error }));
    }
  }
};

// src/index.js
var src_default = (options) => new Server(options);
export {
  Server,
  src_default as default
};
//# sourceMappingURL=index.js.map
