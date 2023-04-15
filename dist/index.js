var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/class/Server.js
import jet13 from "@randajan/jet-core";

// src/tools.js
import { parse as urlParser } from "url";
import jet from "@randajan/jet-core";
var { solid } = jet.prop;
var vault = jet.vault("ODataServer");
var withBrackets = (val, quote = "") => {
  const str = String.jet.to(val, quote + "," + quote);
  return str ? "(" + quote + str + quote + ")" : "";
};
var getScope = (entity, ids, quote = "") => entity + withBrackets(ids, quote);
var getScopeMeta = (entity, ids, quote = "") => "$metadata#" + getScope(entity, ids, quote);
var isWrapped = (str, prefix = "", suffix = "") => typeof str === "string" ? str.startsWith(prefix) && str.endsWith(suffix) : false;
var unwrap = (str, prefix = "", suffix = "") => isWrapped(str = String.jet.to(str), prefix, suffix) ? str.slice(prefix.length, str.length - suffix.length) : "";
var parseUrl = (url, parseQueryString = true, baseUrl = void 0) => {
  url = String.jet.to(url);
  if (baseUrl) {
    url = url.replace(new RegExp(`^((${baseUrl.protocol}//)?${baseUrl.host})?${baseUrl.pathname}`), "");
  }
  url = urlParser(url, parseQueryString);
  solid(url, "base", (!url.host ? "" : (!url.protocol ? "" : url.protocol + "//") + url.host) + url.pathname);
  solid(url, "toString", (_) => url.base, false);
  return url;
};

// src/class/Route.js
import { pathToRegexp } from "path-to-regexp";
import jet5 from "@randajan/jet-core";

// src/actions/resolvers/collections.js
var collections_exports = {};
__export(collections_exports, {
  default: () => collections_default
});
var collections_default = async (context, res) => {
  const { model, server: { url } } = context;
  const collections = [];
  for (const name in model.entitySets) {
    if (!await context.filter(name)) {
      continue;
    }
    collections.push({
      kind: "EntitySet",
      name,
      url: name
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

// src/actions/resolvers/cors.js
var cors_exports = {};
__export(cors_exports, {
  default: () => cors_default
});
var cors_default = async (context, res) => {
  res.stateCode = 204;
  res.end();
};

// src/actions/resolvers/count.js
var count_exports = {};
__export(count_exports, {
  default: () => count_default
});
import jet2 from "@randajan/jet-core";
var count_default = async (context, res) => {
  const count = Math.max(0, Number.jet.to(await context.fetchResponseBodyRaw()));
  const { $select } = await context.fetchOptions();
  const out = {
    "@odata.context": context.getScopeMeta($select ? Object.keys($select) : ""),
    "@odata.count": count,
    value: count
  };
  res.setHeader("Content-Type", "application/json;odata.metadata=minimal");
  res.stateCode = 200;
  res.end(JSON.stringify(out));
};

// src/actions/resolvers/insert.js
var insert_exports = {};
__export(insert_exports, {
  default: () => insert_default
});
var insert_default = async (context, res) => {
  const { primaryKey } = await context.fetchEntity();
  const rawBody = await context.fetchResponseBodyRaw();
  const id = rawBody[primaryKey];
  const out = {};
  out["@odata.context"] = context.getScopeMetaEntity();
  out["@odata.id"] = out["@odata.editLink"] = context.getScope(id, "'");
  await context.pullResponseBody(out);
  res.setHeader("Content-Type", "application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false;charset=utf-8");
  res.setHeader("Location", context.getScope(encodeURI(id), "'"));
  res.statusCode = 201;
  res.end(JSON.stringify(out));
};

// src/actions/resolvers/metadata.js
var metadata_exports = {};
__export(metadata_exports, {
  default: () => metadata_default
});
import jet3 from "@randajan/jet-core";
import builder from "xmlbuilder";
var mapProps = async (props, entity, filter) => {
  const r = [];
  for (const name in props) {
    const { key, type, nullable } = props[name];
    if (!key && entity && !await filter(entity, name)) {
      continue;
    }
    r.push({ "@Name": name, "@Type": type, "@Nullable": nullable });
  }
  return r;
};
var metadata_default = async (context, res) => {
  const { model } = context;
  const namespace = model.namespace;
  const entityTypes = [];
  const entitySets = [];
  const complexTypes = [];
  for (const name in model.entitySets) {
    if (!await context.filter(name)) {
      continue;
    }
    const { entityType, primaryKey, props } = model.entitySets[name];
    entityTypes.push({
      "@Name": unwrap(entityType, namespace + "."),
      Property: await mapProps(props, name, context.filter),
      Key: primaryKey ? { PropertyRef: { "@Name": primaryKey } } : void 0
    });
    entitySets.push({
      "@EntityType": entityType,
      "@Name": name
    });
  }
  for (const name in model.complexTypes) {
    const { props } = model.complexTypes[name];
    complexTypes.push({ "@Name": name, Property: await mapProps(props) });
  }
  const metadata = {
    "edmx:Edmx": {
      "@xmlns:edmx": "http://docs.oasis-open.org/odata/ns/edmx",
      "@Version": "4.0",
      "edmx:DataServices": {
        Schema: {
          "@xmlns": "http://docs.oasis-open.org/odata/ns/edm",
          "@Namespace": model.namespace,
          EntityType: entityTypes,
          EntityContainer: {
            "@Name": "Context",
            EntitySet: entitySets
          },
          ComplexType: complexTypes.length ? complexTypes : void 0
        }
      }
    }
  };
  const out = builder.create(metadata).end({ pretty: true });
  res.setHeader("Content-Type", "application/xml");
  res.stateCode = 200;
  res.end(out);
};

// src/actions/resolvers/query.js
var query_exports = {};
__export(query_exports, {
  default: () => query_default
});
import jet4 from "@randajan/jet-core";
var query_default = async (context, res) => {
  const { params } = context;
  const { primaryKey } = await context.fetchEntity();
  const { $select, $count } = await context.fetchOptions();
  let out = {};
  if (params.hasOwnProperty("id")) {
    out["@odata.context"] = context.getScopeMetaEntity($select ? Object.keys($select) : "");
    await context.pullResponseBody(out);
    if (!out.hasOwnProperty(primaryKey)) {
      throw { code: 404, msg: "Not found" };
    }
  } else {
    out["@odata.context"] = context.getScopeMeta($select ? Object.keys($select) : "");
    const value = await context.pullResponseBody([]);
    if ($count) {
      out["@odata.count"] = value.length;
    }
    out.value = value;
  }
  res.setHeader("Content-Type", "application/json;odata.metadata=minimal");
  res.stateCode = 200;
  res.end(JSON.stringify(out));
};

// src/actions/resolvers/remove.js
var remove_exports = {};
__export(remove_exports, {
  default: () => remove_default
});
var remove_default = async (context, res) => {
  const rawBody = await context.fetchResponseBodyRaw();
  if (!rawBody) {
    throw { code: 404, msg: "Not found" };
  }
  res.stateCode = 204;
  res.end();
};

// src/actions/resolvers/update.js
var update_exports = {};
__export(update_exports, {
  default: () => update_default
});
var update_default = async (context, res) => {
  const rawBody = await context.fetchResponseBodyRaw();
  if (!rawBody) {
    throw { code: 404, msg: "Not found" };
  }
  res.stateCode = 204;
  res.end();
};

// import-glob:./resolvers/**
var modules = [collections_exports, cors_exports, count_exports, insert_exports, metadata_exports, query_exports, remove_exports, update_exports];
var __default = modules;
var filenames = ["./resolvers/collections.js", "./resolvers/cors.js", "./resolvers/count.js", "./resolvers/insert.js", "./resolvers/metadata.js", "./resolvers/query.js", "./resolvers/remove.js", "./resolvers/update.js"];

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
var { solid: solid2, cached, virtual } = jet5.prop;
var decodeParam = (param) => param && decodeURIComponent(param).replace(/(^["'`]+)|(["'`]+$)/g, "");
var Route = class {
  constructor(method, path, action) {
    const keys = [];
    cached(this, {}, "regex", (_) => pathToRegexp(path, keys), false);
    virtual(this, "keys", (_) => {
      this.regex;
      return keys;
    }, false);
    solid2.all(this, {
      method,
      path,
      action
    });
    solid2(this, "resolver", actions_default[action]);
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
      solid2(params, keys[i].name, decodeParam(ex[i + 1]));
    }
    return params;
  }
};

// src/class/Context.js
import jet9 from "@randajan/jet-core";

// src/parsers/options.js
import parser from "odata-parser";
import querystring from "querystring";
import jet6 from "@randajan/jet-core";
var { solid: solid3 } = jet6.prop;
var _allowedQueryOptions = ["$", "$filter", "$expand", "$select", "$orderby", "$top", "$skip", "$count", "$format"];
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
var parseQuery = (url) => {
  let search = url.search;
  if (!search) {
    return;
  }
  let query = {};
  for (let k in url.query) {
    if (_allowedQueryOptions.includes(k)) {
      query[k] = url.query[k];
    }
  }
  if (Boolean.jet.to(query.$count)) {
    query["$inlinecount"] = "allpages";
    delete query.$count;
    search = decodeURIComponent(querystring.stringify(query));
    if (!search) {
      return;
    }
  }
  query = search ? parser.parse(search) : {};
  if (query.$inlinecount != null) {
    query.$count = true;
    delete query.$inlinecount;
  }
  if (query.$top) {
    query.$limit = query.$top;
  }
  query.$sort = parseSort(query.$orderby);
  query.$filter = parseFilter(query.$filter);
  query.$select = parseSelect(query.$select);
  return query;
};
var _fetchOptions = (url, params, primaryKey) => {
  const query = parseQuery(url) || { $filter: {} };
  if (params.count) {
    query.$count = true;
  }
  if (params.id) {
    query.$filter[primaryKey] = params.id;
  }
  return query;
};

// src/parsers/inputs.js
import jet7 from "@randajan/jet-core";
var _fetchBody = async (req) => {
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

// src/parsers/types.js
import jet8 from "@randajan/jet-core";
var { cached: cached2 } = jet8.prop;
var validateChildDefault = (model, msg, name, child) => child;
var assignPack = (obj, model, msg, name, childs, validateChild) => {
  const _p = {};
  const _msg = (text, ...path) => msg(text, name, ...path);
  validateChild = validateChild || validateChildDefault;
  childs = Object.jet.to(childs);
  for (let name2 in childs) {
    const child = childs[name2];
    cached2(obj, _p, name2, (_) => validateChild(model, _msg, name2, child));
  }
  return obj;
};
var _pull = async (context, to, vals, method) => {
  const { name, props } = await context.fetchEntity();
  if (typeof vals !== "object") {
    return to;
  }
  for (let i in vals) {
    const prop = props[i];
    if (!prop) {
      continue;
    }
    if (!prop.key && !await context.filter(name, i)) {
      continue;
    }
    const val = prop[method](vals[i]);
    if (val !== void 0) {
      to[i] = val;
    }
  }
  return to;
};
var pullBody = async (context, to, vals, method) => {
  const toArray = Array.isArray(to);
  vals = toArray === Array.isArray(vals) ? vals : toArray ? [vals] : vals[0];
  if (!toArray) {
    return _pull(context, to, vals, method);
  }
  for (const val of vals) {
    to.push(await _pull(context, {}, val, method));
  }
  return to;
};

// src/class/Context.js
var { solid: solid4, cached: cached3 } = jet9.prop;
var Context = class {
  constructor(server, req, model, adapter, filter) {
    solid4(this, "request", req, false);
    solid4.all(this, {
      server,
      model,
      filter: jet9.isRunnable(filter) ? (entity, property) => filter(this, entity, property) : (_) => true
    });
    cached3.all(this, {}, {
      method: (_) => req.method.toLowerCase(),
      url: (_) => parseUrl(req.originalUrl || req.url, true, server.url),
      route: (_) => server.findRoute(this.method, this.url.pathname),
      params: (_) => this.route.parseParams(this.url.pathname)
    });
    cached3.all(this, {}, {
      _entity: async (_) => {
        const { entity } = this.params;
        if (await this.filter(entity)) {
          return model.findEntity(entity);
        }
        throw { code: 403, msg: `Forbidden` };
      },
      _options: async (_) => _fetchOptions(this.url, this.params, (await this._entity).primaryKey),
      _requestBodyRaw: async (_) => _fetchBody(req),
      _responseBodyRaw: async (_) => {
        const { action } = this.route;
        if (adapter[action]) {
          return adapter[action](this);
        }
        throw { code: 501, msg: `Action '${action}' is not implemented` };
      }
    }, false);
  }
  getScope(ids, quote = "") {
    const { server: { url }, params: { entity } } = this;
    return url + "/" + getScope(entity, ids, quote);
  }
  getScopeMeta(ids, quote = "") {
    const { server: { url }, params: { entity } } = this;
    return url + "/" + getScopeMeta(entity, ids, quote);
  }
  getScopeMetaEntity(ids, quote = "") {
    return this.getScopeMeta(ids, quote) + "/$entity";
  }
  async fetchEntity() {
    return this._entity;
  }
  async fetchOptions() {
    return this._options;
  }
  async fetchRequestBodyRaw() {
    return this._requestBodyRaw;
  }
  async fetchResponseBodyRaw() {
    return this._responseBodyRaw;
  }
  async pullRequestBody(to = {}) {
    return pullBody(this, to, await this.fetchRequestBodyRaw(), "toAdapter");
  }
  async pullResponseBody(to = {}) {
    return pullBody(this, to, await this.fetchResponseBodyRaw(), "toResponse");
  }
};

// src/class/Model.js
import jet12 from "@randajan/jet-core";

// src/class/ModelProp.js
import jet10 from "@randajan/jet-core";

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

// src/class/ModelProp.js
var { solid: solid5 } = jet10.prop;
var convert = (prop, method, vals, subCollection) => {
  const { isCollection, complex, primitive, name, model } = prop;
  if (name.startsWith("@odata")) {
    return;
  }
  if (!subCollection && isCollection) {
    return (Array.isArray(vals) ? vals : [vals]).map((v) => convert(prop, method, v, true));
  }
  if (complex) {
    return complex[method](vals);
  }
  return model.convert[primitive](vals, method);
};
var ModelProp = class {
  constructor(model, msg, name, attrs) {
    solid5(this, "model", model, false);
    solid5(this, "name", name);
    attrs = Object.jet.to(attrs);
    for (const i in attrs) {
      solid5(this, i, attrs[i]);
    }
    if (!this.type) {
      throw Error(msg(`missing!`, name, "type"));
    }
    const unCollection = unwrap(this.type, "Collection(", ")");
    solid5(this, "isCollection", !!unCollection);
    const complexName = unwrap(unCollection || this.type, model.namespace + ".");
    const complex = model.complexTypes[complexName];
    if (complexName && !complex) {
      throw Error(msg(`definition missing at 'model.complexTypes.${complexName}'`, name, "type"));
    }
    solid5(this, "primitive", complex ? void 0 : unCollection || this.type);
    solid5(this, "complex", complex);
    if (!complex && !propTypes.includes(this.primitive)) {
      throw Error(msg(`invalid value '${this.type}' - accepts one of: '${propTypes.join(", ")}'`, name, "type"));
    }
  }
  toAdapter(val) {
    return convert(this, "toAdapter", val);
  }
  toResponse(val) {
    return convert(this, "toResponse", val);
  }
};

// src/class/ModelEntity.js
import jet11 from "@randajan/jet-core";
var { solid: solid6, cached: cached4 } = jet11.prop;
var ModelEntity = class {
  constructor(model, msg, name, attrs) {
    solid6(this, "model", model, false);
    solid6(this, "name", name);
    attrs = Object.jet.to(attrs);
    for (const i in attrs) {
      solid6(this, i, attrs[i]);
    }
    const entityType = this.entityType;
    if (!entityType) {
      throw Error(msg(`missing!`, name, "entityType"));
    }
    const typeName = unwrap(entityType, model.namespace + ".");
    if (!typeName) {
      throw Error(msg(`missing namespace '${model.namespace}' prefix`, name, "entityType"));
    }
    const props = model.entityTypes[typeName];
    if (!props) {
      throw Error(msg(`definition missing at 'model.entityTypes.${typeName}'`, name, "entityType"));
    }
    solid6(this, "props", props);
    for (const propName in props) {
      if (!props[propName].key) {
        continue;
      }
      if (this.primaryKey) {
        throw Error(msg(`primaryKey is allready defined as ${this.primaryKey}`, name, propName));
      }
      solid6(this, "primaryKey", propName);
    }
    if (!this.primaryKey) {
      throw Error(msg(`primaryKey is missing`, name));
    }
  }
};

// src/class/Model.js
var { solid: solid7 } = jet12.prop;
var createProp = (model, msg, name, attrs) => new ModelProp(model, msg, name, attrs);
var createEntity = (model, msg, name, attrs) => new ModelEntity(model, msg, name, attrs);
var createType = (model, msg, name, props) => assignPack({}, model, msg, name, props, createProp);
var Model = class {
  constructor(server, model, converter) {
    const { namespace, entityTypes, entitySets, complexTypes } = model;
    solid7(this, "server", server, false);
    solid7(this, "namespace", String.jet.to(namespace));
    if (!this.namespace) {
      throw Error(this.msg("namespace missing"));
    }
    const _msg = this.msg.bind(this);
    solid7(this, "complexTypes", assignPack({}, this, _msg, "complexTypes", complexTypes, createType));
    solid7(this, "entityTypes", assignPack({}, this, _msg, "entityTypes", entityTypes, createType));
    solid7(this, "entitySets", assignPack({}, this, _msg, "entitySets", entitySets, createEntity));
    solid7(this, "convert", {}, false);
    const csr = jet12.isRunnable(converter);
    if (!csr) {
      converter = Object.jet.to(converter);
    }
    propTypes.map((t) => {
      const fce = csr ? (v, method) => converter(t, v, method) : jet12.isRunnable(converter[t]) ? converter[t] : (v) => v;
      solid7(this.convert, t, fce);
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
  findEntity(name) {
    const ent = this.entitySets[name];
    if (!ent) {
      throw Error(this.msg("not found!", "entitySets", name));
    }
    return ent;
  }
};

// src/class/Server.js
var { solid: solid8, virtual: virtual2, cached: cached5 } = jet13.prop;
var Server = class {
  constructor(config = {}) {
    const { url, model, cors, adapter, converter, filter } = config;
    const [uid, _p] = vault.set({
      isInitialized: false,
      cors: String.jet.to(cors),
      url: String.jet.to(url),
      routes: {},
      adapter,
      filter
    });
    solid8.all(this, {
      uid
    }, false);
    virtual2.all(this, {
      url: (_) => _p.url,
      resolver: (_) => this.resolve.bind(this)
    });
    cached5(_p, {}, "model", async (_) => new Model(this, await (jet13.isRunnable(model) ? model() : model), converter));
    if (_p.url) {
      _p.url = parseUrl(_p.url);
    }
    this.addRoute("get", "/", "collections");
    this.addRoute("get", "/$metadata", "metadata");
    this.addRoute("get", "/:entity/$count", "count");
    this.addRoute("get", "/:entity\\(:id\\)", "query");
    this.addRoute("get", "/:entity", "query");
    this.addRoute("delete", "/:entity\\(:id\\)", "remove");
    this.addRoute("patch", "/:entity\\(:id\\)", "update");
    this.addRoute("post", "/:entity", "insert");
    if (_p.cors) {
      this.addRoute("options", "/(.*)", "cors");
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
      if (!_p.url) {
        if (!req.protocol) {
          throw Error(this.msg("Unable to determine server url from the request or value provided in the ODataServer constructor."));
        }
        const urlFull = parseUrl(req.protocol + "://" + req.get("host") + (req.originalUrl || req.url));
        _p.url = parseUrl(urlFull.base.replace(/\/[^\/]*$/g, ""));
      }
      res.setHeader("OData-Version", "4.0");
      res.setHeader("DataServiceVersion", "4.0");
      if (_p.cors) {
        res.setHeader("Access-Control-Allow-Origin", _p.cors);
      }
      const context = new Context(this, req, await _p.model, _p.adapter, _p.filter);
      const { action, resolver } = context.route;
      if (action === "count") {
        solid8(context.params, "count", true);
      }
      await resolver(context, res);
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
