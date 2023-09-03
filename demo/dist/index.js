// <define:__slib_info>
var define_slib_info_default = { isProd: false, name: "@randajan/odata-server", description: "OData server with adapter for mongodb", version: "2.1.12", author: "Jan Randa", env: "dev", mode: "node", port: 4002, dir: { root: "C:\\dev\\lib\\odata-server", dist: "demo/dist" } };

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
import jet10 from "@randajan/jet-core";
import { parse as urlParser } from "url";
import builder from "xmlbuilder";
import jet from "@randajan/jet-core";
import { pathToRegexp } from "path-to-regexp";
import jet2 from "@randajan/jet-core";
import builder2 from "xmlbuilder";
import jet6 from "@randajan/jet-core";
import jet3 from "@randajan/jet-core";
import jet4 from "@randajan/jet-core";
import jet5 from "@randajan/jet-core";
import jet9 from "@randajan/jet-core";
import jet8 from "@randajan/jet-core";
import parser from "odata-parser";
import querystring from "querystring";
import jet7 from "@randajan/jet-core";
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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
var trimUrl = (pathname) => pathname.endsWith("/") ? pathname.slice(0, pathname.length - 1) : pathname;
var parseUrl = (url, parseQueryString = false) => {
  url = urlParser(String.jet.to(url) || "/", parseQueryString);
  solid(url, "base", (!url.host ? "" : (!url.protocol ? "" : url.protocol + "//") + url.host) + trimUrl(url.pathname));
  solid(url, "toString", (_) => url.base, false);
  return url;
};
var decodeParam = (param) => param && decodeURIComponent(param).replace(/(^["'`]+)|(["'`]+$)/g, "");
var _knownBodyTypes = ["json", "xml"];
var setResponderBody = (responder, body, defaultType = "json", extraType = "") => {
  let type = responder.getType();
  if (!type || !_knownBodyTypes.includes(type)) {
    type = defaultType;
  }
  responder.setHeader("Content-Type", `application/${type}` + (extraType ? ";" + extraType : ""));
  const out = type === "json" ? JSON.stringify(body) : builder.create(body).end({ pretty: true });
  return responder.setBody(200, out);
};
var collections_exports = {};
__export(collections_exports, {
  default: () => collections_default
});
var collections_default = async (context) => {
  const { responder, model: model2, gw: { url } } = context;
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
  responder.setHeader("Content-Type", "application/json");
  return responder.setBody(200, JSON.stringify(out));
};
var cors_exports = {};
__export(cors_exports, {
  default: () => cors_default
});
var cors_default = async (context) => {
  const { responder } = context;
  return responder.setBody(204);
};
var count_exports = {};
__export(count_exports, {
  default: () => count_default
});
var count_default = async (context) => {
  const { responder } = context;
  const count = Math.max(0, Number.jet.to(await context.fetchResponseBodyRaw()));
  const { $select } = await context.fetchOptions();
  const out = {
    "@odata.context": context.getScopeMeta($select ? Object.keys($select) : ""),
    "@odata.count": count,
    value: count
  };
  responder.setHeader("Content-Type", "application/json;odata.metadata=minimal");
  return responder.setBody(200, JSON.stringify(out));
};
var insert_exports = {};
__export(insert_exports, {
  default: () => insert_default
});
var insert_default = async (context) => {
  const { responder } = context;
  const { primaryKey } = await context.fetchEntity();
  const rawBody = await context.fetchResponseBodyRaw();
  const id = rawBody[primaryKey];
  const out = {};
  out["@odata.context"] = context.getScopeMetaEntity();
  out["@odata.id"] = out["@odata.editLink"] = context.getScope(id, "'");
  await context.pullResponseBody(out);
  responder.setHeader("Content-Type", "application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false;charset=utf-8");
  responder.setHeader("Location", context.getScope(encodeURI(id), "'"));
  return responder.setBody(201, JSON.stringify(out));
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
var metadata_default = async (context) => {
  const { model: model2, responder } = context;
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
  const out = {
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
  return setResponderBody(responder, out, "xml");
};
var query_exports = {};
__export(query_exports, {
  default: () => query_default
});
var query_default = async (context) => {
  const { responder, params } = context;
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
  responder.setHeader("Content-Type", "application/json;odata.metadata=minimal");
  return responder.setBody(200, JSON.stringify(out));
};
var remove_exports = {};
__export(remove_exports, {
  default: () => remove_default
});
var remove_default = async (context) => {
  const { responder } = context;
  await context.fetchEntity();
  const rawBody = await context.fetchResponseBodyRaw();
  if (!rawBody) {
    throw { code: 404, msg: "Not found" };
  }
  return responder.setBody(204);
};
var update_exports = {};
__export(update_exports, {
  default: () => update_default
});
var update_default = async (context) => {
  const { responder } = context;
  await context.fetchEntity();
  const rawBody = await context.fetchResponseBodyRaw();
  if (!rawBody) {
    throw { code: 404, msg: "Not found" };
  }
  return responder.setBody(204);
};
var modules = [collections_exports, cors_exports, count_exports, insert_exports, metadata_exports, query_exports, remove_exports, update_exports];
var __default = modules;
var filenames = ["./resolvers/collections.js", "./resolvers/cors.js", "./resolvers/count.js", "./resolvers/insert.js", "./resolvers/metadata.js", "./resolvers/query.js", "./resolvers/remove.js", "./resolvers/update.js"];
var _prefix = "./resolvers/";
var _suffix = ".js";
var methods = {};
var actions_default = methods;
filenames.forEach((pathname, index) => {
  const name = pathname.substring(_prefix.length).slice(0, -_suffix.length);
  methods[name] = __default[index].default;
});
var { solid: solid2, cached, virtual } = jet2.prop;
var Route = class {
  constructor(server, method, path, action) {
    const keys = [];
    cached(this, {}, "regex", (_) => pathToRegexp(path, keys), false);
    virtual(this, "keys", (_) => {
      this.regex;
      return keys;
    }, false);
    solid2(this, "server", server, false);
    solid2.all(this, {
      method,
      path,
      action
    });
    solid2(this, "resolve", actions_default[action]);
    if (!this.resolve) {
      throw Error(this.msg(`action '${action}' is not one of: '${Object.keys(actions_default).join(", ")}'`));
    }
  }
  msg(text) {
    return this.server.msg(`route '${this.path}' ${text}`);
  }
  test(pathname) {
    return this.regex.test(pathname);
  }
  parseParams(pathname) {
    const { action, regex, keys } = this;
    const ex = regex.exec(pathname);
    if (!ex) {
      throw Error(this.msg(`parseParams('${pathname}') failed`));
    }
    const params = {};
    for (let i = 0; i < keys.length; i++) {
      solid2(params, keys[i].name, decodeParam(ex[i + 1]));
    }
    solid2(params, "count", action === "count");
    return params;
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
  "Edm.Binary",
  "Edm.Duration"
];
var allowedQueryOptions = ["$", "$filter", "$expand", "$select", "$orderby", "$top", "$skip", "$count", "$format"];
var { solid: solid3 } = jet3.prop;
var convert = (prop, vals, method, context, subCollection) => {
  const { isCollection, complex, primitive, name, model: model2 } = prop;
  if (name.startsWith("@odata")) {
    return;
  }
  if (!subCollection && isCollection) {
    return (Array.isArray(vals) ? vals : [vals]).map((v) => convert(prop, v, method, context, true));
  }
  if (complex) {
    return complex[method](vals);
  }
  return model2.convert[primitive](vals, method, context);
};
var ModelProp = class {
  constructor(model2, msg, name, attrs) {
    solid3(this, "model", model2, false);
    solid3(this, "name", name);
    attrs = Object.jet.to(attrs);
    for (const i in attrs) {
      solid3(this, i, attrs[i]);
    }
    if (!this.type) {
      throw Error(msg(`missing!`, name, "type"));
    }
    const unCollection = unwrap(this.type, "Collection(", ")");
    solid3(this, "isCollection", !!unCollection);
    const complexName = unwrap(unCollection || this.type, model2.namespace + ".");
    const complex = model2.complexTypes[complexName];
    if (complexName && !complex) {
      throw Error(msg(`definition missing at 'model.complexTypes.${complexName}'`, name, "type"));
    }
    solid3(this, "primitive", complex ? void 0 : unCollection || this.type);
    solid3(this, "complex", complex);
    if (!complex && !propTypes.includes(this.primitive)) {
      throw Error(msg(`invalid value '${this.type}' - accepts one of: '${propTypes.join(", ")}'`, name, "type"));
    }
  }
  convert(val, method, context) {
    return convert(this, val, method, context);
  }
  toAdapter(val, context) {
    return this.convert(val, "toAdapter", context);
  }
  toResponse(val, context) {
    return this.convert(val, "toResponse", context);
  }
};
var { solid: solid4, cached: cached2 } = jet4.prop;
var ModelEntity = class {
  constructor(model2, msg, name, attrs) {
    solid4(this, "model", model2, false);
    solid4(this, "name", name);
    attrs = Object.jet.to(attrs);
    for (const i in attrs) {
      solid4(this, i, attrs[i]);
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
    solid4(this, "props", props);
    solid4(this, "propsList", Object.keys(props));
    for (const propName in props) {
      if (!props[propName].key) {
        continue;
      }
      if (this.primaryKey) {
        throw Error(msg(`primaryKey is allready defined as ${this.primaryKey}`, name, propName));
      }
      solid4(this, "primaryKey", propName);
    }
    if (!this.primaryKey) {
      throw Error(msg(`primaryKey is missing`, name));
    }
  }
  async forProps(callback) {
    await Promise.all(this.propsList.map((i) => callback(this.props[i], i)));
  }
  async mapProps(callback, byKey = false) {
    const res = byKey ? {} : [];
    await this.forProps(async (prop, i) => {
      const r = await callback(prop, i);
      if (r === void 0) {
        return;
      }
      if (byKey) {
        res[i] = r;
      } else {
        res.push(r);
      }
    });
    return res;
  }
};
var { cached: cached3 } = jet5.prop;
var validateChildDefault = (model2, msg, name, child) => child;
var assignPack = (obj, model2, msg, name, childs, validateChild) => {
  const _p = {};
  const _msg = (text, ...path) => msg(text, name, ...path);
  validateChild = validateChild || validateChildDefault;
  childs = Object.jet.to(childs);
  for (let name2 in childs) {
    const child = childs[name2];
    cached3(obj, _p, name2, (_) => validateChild(model2, _msg, name2, child));
  }
  return obj;
};
var _pull = async (vals, method, context, to) => {
  const ent = await context.fetchEntity();
  const tpv = typeof vals;
  if (tpv !== "function" && tpv !== "object") {
    return to;
  }
  if (typeof to !== "object") {
    to = {};
  }
  ent.forProps(async (prop, i) => {
    if (!prop.key && !await context.filter(ent.name, i)) {
      return;
    }
    const val = prop.convert(tpv === "function" ? await vals(i) : vals[i], method, context);
    if (val !== void 0) {
      to[i] = val;
    }
  });
  return to;
};
var pullBody = async (vals, method, context, to) => {
  const toArray = Array.isArray(to);
  vals = toArray === Array.isArray(vals) ? vals : toArray ? [vals] : vals[0];
  if (!toArray) {
    return _pull(vals, method, context, to);
  }
  for (const raw of vals) {
    const val = await _pull(raw, method, context);
    if (val) {
      to.push(val);
    }
  }
  return to;
};
var { solid: solid5 } = jet6.prop;
var createProp = (model2, msg, name, attrs) => new ModelProp(model2, msg, name, attrs);
var createEntity = (model2, msg, name, attrs) => new ModelEntity(model2, msg, name, attrs);
var createType = (model2, msg, name, props) => assignPack({}, model2, msg, name, props, createProp);
var Model = class {
  constructor(server, model2, converter) {
    const { namespace, entityTypes, entitySets, complexTypes } = model2;
    solid5(this, "server", server, false);
    solid5(this, "namespace", String.jet.to(namespace));
    if (!this.namespace) {
      throw Error(this.msg("namespace missing"));
    }
    const _msg = this.msg.bind(this);
    solid5(this, "complexTypes", assignPack({}, this, _msg, "complexTypes", complexTypes, createType));
    solid5(this, "entityTypes", assignPack({}, this, _msg, "entityTypes", entityTypes, createType));
    solid5(this, "entitySets", assignPack({}, this, _msg, "entitySets", entitySets, createEntity));
    solid5(this, "convert", {}, false);
    const csr = jet6.isRunnable(converter);
    if (!csr) {
      converter = Object.jet.to(converter);
    }
    propTypes.map((t) => {
      const fce = csr ? (v, method, context) => converter(t, v, method, context) : jet6.isRunnable(converter[t]) ? converter[t] : (v) => v;
      solid5(this.convert, t, fce);
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
    if (allowedQueryOptions.includes(k)) {
      query[k] = url.query[k];
    }
  }
  if (Boolean.jet.to(query.$count)) {
    query["$inlinecount"] = "allpages";
    delete query.$count;
    search = querystring.stringify(query);
    if (!search) {
      return;
    }
  }
  search = decodeURIComponent((unwrap(search, "?") || search).replace(/\+/g, " "));
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
var { solid: solid6, cached: cached4, safe } = jet8.prop;
var Context = class {
  constructor(gw, model2, responder, adapter, filter) {
    const { server } = gw;
    solid6.all(this, {
      server,
      gw,
      model: model2
    });
    solid6.all(this, {
      responder,
      filter: jet8.isRunnable(filter) ? (entity, property) => filter(this, entity, property) : (_) => true
    }, false);
    cached4.all(this, {}, {
      url: (_) => {
        const urlReq = responder.getURL();
        const urlBase = trimUrl(gw.url.pathname);
        if (!isWrapped(urlReq, urlBase)) {
          return {};
        }
        return parseUrl(unwrap(urlReq, urlBase), true);
      },
      method: (_) => responder.getMethod().toLowerCase(),
      route: (_) => server.findRoute(this.method, this.url.pathname),
      params: (_) => this.route.parseParams(this.url.pathname)
    });
    cached4.all(this, {}, {
      _entity: async (_) => {
        const { entity } = this.params;
        if (await this.filter(entity)) {
          return this.model.findEntity(entity);
        }
        throw { code: 403, msg: `Forbidden` };
      },
      _options: async (_) => _fetchOptions(this.url, this.params, (await this._entity).primaryKey),
      _requestBodyRaw: async (_) => responder.getBody(),
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
    const { gw: { url }, params: { entity } } = this;
    return url + "/" + getScope(entity, ids, quote);
  }
  getScopeMeta(ids, quote = "") {
    const { gw: { url }, params: { entity } } = this;
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
    return pullBody(await this.fetchRequestBodyRaw(), "toAdapter", this, to);
  }
  async pullResponseBody(to = {}) {
    return pullBody(await this.fetchResponseBodyRaw(), "toResponse", this, to);
  }
};
var { solid: solid7 } = jet9.prop;
var Gateway = class {
  constructor(server, url, options = {}, extendArgs = []) {
    const { adapter, filter, extender } = options;
    solid7.all(this, {
      url: parseUrl(url, false)
    });
    solid7.all(this, {
      server,
      fetchContext: async (responder) => {
        const context = new Context(this, await server.fetchModel(), responder, adapter, filter);
        if (jet9.isRunnable(extender)) {
          await extender(context, ...extendArgs);
        }
        return context;
      }
    }, false);
  }
  msg(text) {
    return this.server.msg(this.url.pathname + " " + text);
  }
  async resolve(responder) {
    const { server } = this;
    let context;
    try {
      responder.setHeader("OData-Version", "4.0");
      responder.setHeader("DataServiceVersion", "4.0");
      if (server.cors) {
        responder.setHeader("Access-Control-Allow-Origin", server.cors);
      }
      context = await this.fetchContext(responder);
      return await context.route.resolve(context);
    } catch (e) {
      const error = {
        code: e?.code || 500,
        message: e?.msg || e?.message || "Unknown error",
        stack: e?.stack,
        method: responder.getMethod(),
        target: responder.getURL(),
        details: []
      };
      responder.setHeader("Content-Type", "application/json");
      responder.setBody(error.code, JSON.stringify({ error }));
      server.onError(context, error);
    }
  }
};
var { solid: solid8, cached: cached5 } = jet10.prop;
var Server = class {
  constructor(options = {}) {
    const { model: model2, cors, converter, onError } = options;
    const [uid, _p] = vault.set({
      routes: {}
    });
    solid8(this, "uid", uid, false);
    solid8(this, "cors", String.jet.to(cors));
    cached5.all(this, _p, {
      _model: async (_) => new Model(this, await (jet10.isRunnable(model2) ? model2() : model2), converter)
    }, false);
    solid8.all(this, {
      serve: (responder, url, ...extendArgs) => {
        const gw = new Gateway(this, url, options, extendArgs);
        return (...a) => gw.resolve(responder(...a));
      },
      onError: jet10.isRunnable(onError) ? onError : () => {
      }
    }, false);
    this.addRoute("get", "/", "collections");
    this.addRoute("get", "/$metadata", "metadata");
    this.addRoute("get", "/:entity/$count", "count");
    this.addRoute("get", "/:entity\\(:id\\)", "query");
    this.addRoute("get", "/:entity", "query");
    this.addRoute("delete", "/:entity\\(:id\\)", "remove");
    this.addRoute("patch", "/:entity\\(:id\\)", "update");
    this.addRoute("post", "/:entity", "insert");
    if (this.cors) {
      this.addRoute("options", "/(.*)", "cors");
    }
  }
  msg(text) {
    return "OData server " + text;
  }
  addRoute(method, path, action) {
    const { routes } = vault.get(this.uid);
    const list = routes[method] || (routes[method] = []);
    const route = new Route(this, method, path, action);
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
  async fetchModel() {
    return this._model;
  }
};
var src_default = (options) => new Server(options);

// dist/mods/adapter/Mongo.js
import { ObjectId } from "mongodb";
import jet11 from "@randajan/jet-core";
var { solid: solid9 } = jet11.prop;
var MongoAdapter = class {
  constructor(connect) {
    solid9(this, "connect", connect, false);
  }
  optValidator(val, fk, pk, key) {
    return key === "_id" ? ObjectId(val) : val;
  }
  optValidate(o) {
    return jet11.map(o, this.optValidator.bind(this), true);
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
      body[primaryKey] = jet11.uid(16);
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
var Mongo_default = (connect) => new MongoAdapter(connect);

// dist/mods/responder/Express.js
import jet12 from "@randajan/jet-core";
var { solid: solid10 } = jet12.prop;
var ExpressResponder = class {
  constructor(request, response) {
    solid10.all(this, { request, response });
  }
  getURL() {
    const req = this.request;
    return req.originalUrl || req.url;
  }
  getMethod() {
    return this.request.method;
  }
  async getBody() {
    const req = this.request;
    if (req.body) {
      return req.body;
    }
    return new Promise((res, rej) => {
      let body = "";
      req.on("data", (data) => {
        if ((body += data).length > 1e6) {
          rej({ statusCode: 400, msg: "Request is too long" });
        }
      });
      req.on("end", (_) => {
        try {
          res(body ? JSON.parse(body) : void 0);
        } catch (e) {
          rej({ statusCode: 400, msg: e.message });
        }
      });
    });
  }
  getType() {
    const req = this.request;
    const headers = jet12.json.from(req.headers);
    const accept = headers?.accept;
    if (typeof accept !== "string") {
      return;
    }
    const xml = accept.includes("xml");
    const json = accept.includes("json");
    if (xml !== json) {
      return xml ? "xml" : "json";
    }
  }
  setHeader(name, value) {
    this.response.setHeader(name, value);
  }
  setBody(statusCode, body) {
    const res = this.response;
    res.statusCode = statusCode;
    res.end(body);
  }
};
var Express_default = (req, res) => new ExpressResponder(req, res);

// demo/src/index.js
import { MongoClient } from "mongodb";
import http from "http";
var mongo = {
  url: "mongodb://localhost:27017"
};
var model = {
  namespace: "main",
  entityTypes: {
    "UserType": {
      "_id": { "type": "Edm.String", key: true },
      "name": { "type": "Edm.String" }
    }
  },
  entitySets: {
    "users": {
      entityType: "main.UserType"
    }
  }
};
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
  model,
  cors: "*",
  adapter: Mongo_default(getMongo),
  filter: async (context, collectionName, propertyName) => {
    if (context.test === "test") {
      return false;
    }
    return true;
  },
  extender: async (context, test) => {
    context.test = test;
  }
});
http.createServer(mongoApi.serve(Express_default, "http://localhost:1337/odata", "tesst")).listen(1337);
//# sourceMappingURL=index.js.map
