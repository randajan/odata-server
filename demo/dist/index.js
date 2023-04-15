// <define:__slib_info>
var define_slib_info_default = { isProd: false, name: "@randajan/odata-server", description: "OData server with adapter for mongodb", version: "1.5.0", author: "Jan Randa", env: "prod", mode: "node", port: 4002, dir: { root: "C:\\dev\\lib\\odata-server", dist: "demo/dist" } };

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
import jet13 from "@randajan/jet-core";
import jet from "@randajan/jet-core";
import { pathToRegexp } from "path-to-regexp";
import jet5 from "@randajan/jet-core";
import jet2 from "@randajan/jet-core";
import jet3 from "@randajan/jet-core";
import builder from "xmlbuilder";
import jet4 from "@randajan/jet-core";
import { parse as parseUrl } from "url";
import jet9 from "@randajan/jet-core";
import parser from "odata-parser";
import querystring from "querystring";
import jet6 from "@randajan/jet-core";
import jet7 from "@randajan/jet-core";
import jet8 from "@randajan/jet-core";
import jet12 from "@randajan/jet-core";
import jet10 from "@randajan/jet-core";
import jet11 from "@randajan/jet-core";
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var vault = jet.vault("ODataServer");
var escapeRegExp = (str) => new RegExp(str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") + "$");
var withBrackets = (val, quote = "") => {
  const str = String.jet.to(val, quote + "," + quote);
  return str ? "(" + quote + str + quote + ")" : "";
};
var getScope = (entity, ids, quote = "") => entity + withBrackets(ids, quote);
var getScopeMeta = (entity, ids, quote = "") => "$metadata#" + getScope(entity, ids, quote);
var isWrapped = (str, prefix = "", suffix = "") => typeof str === "string" ? str.startsWith(prefix) && str.endsWith(suffix) : false;
var unwrap = (str, prefix = "", suffix = "") => isWrapped(str = String.jet.to(str), prefix, suffix) ? str.slice(prefix.length, str.length - suffix.length) : "";
var collections_exports = {};
__export(collections_exports, {
  default: () => collections_default
});
var collections_default = async (context, res) => {
  const { model: model2, server: { url } } = context;
  const collections = [];
  for (const name in model2.entitySets) {
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
var count_exports = {};
__export(count_exports, {
  default: () => count_default
});
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
var metadata_exports = {};
__export(metadata_exports, {
  default: () => metadata_default
});
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
  const { model: model2 } = context;
  const namespace = model2.namespace;
  const entityTypes = [];
  const entitySets = [];
  const complexTypes = [];
  for (const name in model2.entitySets) {
    if (!await context.filter(name)) {
      continue;
    }
    const { entityType, primaryKey, props } = model2.entitySets[name];
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
  for (const name in model2.complexTypes) {
    const { props } = model2.complexTypes[name];
    complexTypes.push({ "@Name": name, Property: await mapProps(props) });
  }
  const metadata = {
    "edmx:Edmx": {
      "@xmlns:edmx": "http://docs.oasis-open.org/odata/ns/edmx",
      "@Version": "4.0",
      "edmx:DataServices": {
        Schema: {
          "@xmlns": "http://docs.oasis-open.org/odata/ns/edm",
          "@Namespace": model2.namespace,
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
var query_exports = {};
__export(query_exports, {
  default: () => query_default
});
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
var modules = [collections_exports, count_exports, insert_exports, metadata_exports, query_exports, remove_exports, update_exports];
var __default = modules;
var filenames = ["./resolvers/collections.js", "./resolvers/count.js", "./resolvers/insert.js", "./resolvers/metadata.js", "./resolvers/query.js", "./resolvers/remove.js", "./resolvers/update.js"];
var _prefix = "./resolvers/";
var _suffix = ".js";
var methods = {};
var actions_default = methods;
filenames.forEach((pathname, index) => {
  const name = pathname.substring(_prefix.length).slice(0, -_suffix.length);
  methods[name] = __default[index].default;
});
var { solid, cached, virtual } = jet5.prop;
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
var { solid: solid2 } = jet6.prop;
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
var { cached: cached2 } = jet8.prop;
var validateChildDefault = (model2, msg, name, child) => child;
var assignPack = (obj, model2, msg, name, childs, validateChild) => {
  const _p = {};
  const _msg = (text, ...path) => msg(text, name, ...path);
  validateChild = validateChild || validateChildDefault;
  childs = Object.jet.to(childs);
  for (let name2 in childs) {
    const child = childs[name2];
    cached2(obj, _p, name2, (_) => validateChild(model2, _msg, name2, child));
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
var { solid: solid3, cached: cached3 } = jet9.prop;
var Context = class {
  constructor(server, req, model2, adapter, filter) {
    solid3(this, "request", req, false);
    solid3.all(this, {
      server,
      model: model2,
      filter: jet9.isRunnable(filter) ? (entity, property) => filter(this, entity, property) : (_) => true
    });
    cached3.all(this, {}, {
      method: (_) => req.method.toLowerCase(),
      url: (_) => parseUrl(req.originalUrl || req.url, true),
      route: (_) => server.findRoute(this.method, this.url.pathname),
      params: (_) => this.route.parseParams(this.url.pathname)
    });
    cached3.all(this, {}, {
      _entity: async (_) => {
        const { entity } = this.params;
        if (await this.filter(entity)) {
          return model2.findEntity(entity);
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
var { solid: solid4 } = jet10.prop;
var convert = (prop, method, vals, subCollection) => {
  const { isCollection, complex, primitive, name, model: model2 } = prop;
  if (name.startsWith("@odata")) {
    return;
  }
  if (!subCollection && isCollection) {
    return (Array.isArray(vals) ? vals : [vals]).map((v) => convert(prop, method, v, true));
  }
  if (complex) {
    return complex[method](vals);
  }
  return model2.convert[primitive](vals, method);
};
var ModelProp = class {
  constructor(model2, msg, name, attrs) {
    solid4(this, "model", model2, false);
    solid4(this, "name", name);
    attrs = Object.jet.to(attrs);
    for (const i in attrs) {
      solid4(this, i, attrs[i]);
    }
    if (!this.type) {
      throw Error(msg(`missing!`, name, "type"));
    }
    const unCollection = unwrap(this.type, "Collection(", ")");
    solid4(this, "isCollection", !!unCollection);
    const complexName = unwrap(unCollection || this.type, model2.namespace + ".");
    const complex = model2.complexTypes[complexName];
    if (complexName && !complex) {
      throw Error(msg(`definition missing at 'model.complexTypes.${complexName}'`, name, "type"));
    }
    solid4(this, "primitive", complex ? void 0 : unCollection || this.type);
    solid4(this, "complex", complex);
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
var { solid: solid5, cached: cached4 } = jet11.prop;
var ModelEntity = class {
  constructor(model2, msg, name, attrs) {
    solid5(this, "model", model2, false);
    solid5(this, "name", name);
    attrs = Object.jet.to(attrs);
    for (const i in attrs) {
      solid5(this, i, attrs[i]);
    }
    const entityType = this.entityType;
    if (!entityType) {
      throw Error(msg(`missing!`, name, "entityType"));
    }
    const typeName = unwrap(entityType, model2.namespace + ".");
    if (!typeName) {
      throw Error(msg(`missing namespace '${model2.namespace}' prefix`, name, "entityType"));
    }
    const props = model2.entityTypes[typeName];
    if (!props) {
      throw Error(msg(`definition missing at 'model.entityTypes.${typeName}'`, name, "entityType"));
    }
    solid5(this, "props", props);
    for (const propName in props) {
      if (!props[propName].key) {
        continue;
      }
      if (this.primaryKey) {
        throw Error(msg(`primaryKey is allready defined as ${this.primaryKey}`, name, propName));
      }
      solid5(this, "primaryKey", propName);
    }
    if (!this.primaryKey) {
      throw Error(msg(`primaryKey is missing`, name));
    }
  }
};
var { solid: solid6 } = jet12.prop;
var createProp = (model2, msg, name, attrs) => new ModelProp(model2, msg, name, attrs);
var createEntity = (model2, msg, name, attrs) => new ModelEntity(model2, msg, name, attrs);
var createType = (model2, msg, name, props) => assignPack({}, model2, msg, name, props, createProp);
var Model = class {
  constructor(server, model2, converter) {
    const { namespace, entityTypes, entitySets, complexTypes } = model2;
    solid6(this, "server", server, false);
    solid6(this, "namespace", String.jet.to(namespace));
    if (!this.namespace) {
      throw Error(this.msg("namespace missing"));
    }
    const _msg = this.msg.bind(this);
    solid6(this, "complexTypes", assignPack({}, this, _msg, "complexTypes", complexTypes, createType));
    solid6(this, "entityTypes", assignPack({}, this, _msg, "entityTypes", entityTypes, createType));
    solid6(this, "entitySets", assignPack({}, this, _msg, "entitySets", entitySets, createEntity));
    solid6(this, "convert", {}, false);
    const csr = jet12.isRunnable(converter);
    if (!csr) {
      converter = Object.jet.to(converter);
    }
    propTypes.map((t) => {
      const fce = csr ? (v, method) => converter(t, v, method) : jet12.isRunnable(converter[t]) ? converter[t] : (v) => v;
      solid6(this.convert, t, fce);
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
var { solid: solid7, virtual: virtual2, cached: cached5 } = jet13.prop;
var Server = class {
  constructor(config = {}) {
    const { url, model: model2, cors, adapter, converter, filter } = config;
    const [uid, _p] = vault.set({
      isInitialized: false,
      url,
      cors,
      routes: {},
      adapter,
      filter
    });
    solid7.all(this, {
      uid
    }, false);
    virtual2.all(this, {
      url: (_) => _p.url,
      resolver: (_) => this.resolve.bind(this)
    });
    cached5(_p, {}, "model", async (_) => new Model(this, jet13.isRunnable(model2) ? await model2() : model2, converter));
    this.addRoute("delete", "/:entity\\(:id\\)", "remove");
    this.addRoute("patch", "/:entity\\(:id\\)", "update");
    this.addRoute("post", "/:entity", "insert");
    this.addRoute("get", "/:entity/$count", "count");
    this.addRoute("get", "/:entity\\(:id\\)", "query");
    this.addRoute("get", "/:entity", "query");
    this.addRoute("get", "/$metadata", "metadata");
    this.addRoute("get", "/", "collections");
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
      if (!_p.url) {
        if (!req.protocol) {
          throw Error(this.text("Unable to determine server url from the request or value provided in the ODataServer constructor."));
        }
        const path = (req.originalUrl || "/").replace(escapeRegExp(req.url), "");
        _p.url = req.protocol + "://" + req.get("host") + path;
      }
      res.setHeader("OData-Version", "4.0");
      res.setHeader("DataServiceVersion", "4.0");
      if (_p.cors) {
        res.setHeader("Access-Control-Allow-Origin", _p.cors);
      }
      const context = new Context(this, req, await _p.model, _p.adapter, _p.filter);
      const { action, resolver } = context.route;
      if (action === "count") {
        solid7(context.params, "count", true);
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
var src_default = (options) => new Server(options);

// dist/adapter/MongoAdapter.js
import { ObjectId } from "mongodb";
import jet14 from "@randajan/jet-core";
var { solid: solid8 } = jet14.prop;
var MongoAdapter = class {
  constructor(connect) {
    solid8(this, "connect", connect, false);
  }
  optValidator(val, fk, pk, key) {
    return key === "_id" ? ObjectId(val) : val;
  }
  optValidate(o) {
    return jet14.map(o, this.optValidator.bind(this), true);
  }
  async getDB(context) {
    return (await this.connect(context)).db(context.model.namespace);
  }
  async getCollection(context) {
    return (await this.getDB(context)).collection(context.params.entity);
  }
  async remove(context) {
    const options = await context.fetchOptions();
    const { $filter } = this.optValidate({ $filter: options.$filter });
    const col = await this.getCollection(context);
    const res = await col.deleteOne($filter);
    return res.deletedCount;
  }
  async update(context) {
    const options = await context.fetchOptions();
    const { $filter } = this.optValidate({ $filter: options.$filter });
    const col = await this.getCollection(context);
    const res = await col.updateOne($filter, { $set: await context.pullRequestBody({}) });
    return res.matchedCount;
  }
  async insert(context) {
    const { primaryKey } = await context.fetchEntity();
    const body = await context.pullRequestBody({});
    if (primaryKey !== "_id" && !body[primaryKey]) {
      body[primaryKey] = jet14.uid(16);
    }
    const col = await this.getCollection(context);
    const value = await col.insertOne(body);
    return col.findOne({ _id: value.insertedId });
  }
  async query(context) {
    const options = await context.fetchOptions();
    const { $select, $sort, $skip, $limit, $filter } = this.optValidate(options);
    const col = await this.getCollection(context);
    let qr = col.find($filter, { projection: $select || {} });
    if ($sort) {
      qr = qr.sort($sort);
    }
    if ($skip) {
      qr = qr.skip($skip);
    }
    if ($limit) {
      qr = qr.limit($limit);
    }
    return qr.toArray();
  }
  async count(context) {
    return (await this.query(context)).length;
  }
};
var MongoAdapter_default = (connect) => new MongoAdapter(connect);

// demo/src/index.js
import { MongoClient } from "mongodb";
import http from "http";
var mongo = {
  url: "mongodb://localhost:27017"
};
var model = async (_) => ({
  namespace: "main",
  entityTypes: {
    "UserType": {
      "_id": { "type": "Edm.String", key: true },
      "test": { "type": "Edm.String" }
    }
  },
  entitySets: {
    "users": {
      entityType: "main.UserType"
    }
  }
});
var getMongo = async (context) => {
  if (!mongo.current) {
    mongo.current = await MongoClient.connect(mongo.url);
    mongo.current.on("close", (_) => {
      delete mongo.current;
    });
    process.on("exit", (_) => {
      if (mongo.current) {
        mongo.current.close();
      }
    });
  }
  return mongo.current;
};
var mongoApi = src_default({
  url: "http://localhost:1337",
  model,
  adapter: MongoAdapter_default(getMongo),
  converter: (primitive, value, method) => {
    return value;
  },
  filter: (context, collectionName, propertyName) => {
    return true;
  }
});
http.createServer(mongoApi.resolver).listen(1337);
//# sourceMappingURL=index.js.map
