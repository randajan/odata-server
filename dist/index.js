// src/class/ODataServer.js
import { EventEmitter } from "events";
import url2 from "url";
import { Buffer } from "safe-buffer";

// src/class/Router.js
import url from "url";
import pathToRegexp from "path-to-regexp";
import methods from "methods";
var decode = (val) => val && decodeURIComponent(val);
var Router = class {
  constructor(prefix) {
    this.routes = {};
    this.prefix = prefix === "/" ? "" : prefix;
    methods.forEach((method) => this.routes[method] = []);
  }
  error(fn) {
    this._errFn = fn;
  }
  dispatch(req, res) {
    const m = req.method.toLowerCase();
    res.odataError = (err) => this._errFn(req, res, err);
    const { pathname } = url.parse(req.originalUrl || req.url);
    let match = false;
    for (const el of this.routes[m]) {
      const keys = [];
      const re = pathToRegexp(el.route, keys);
      const ex = re.exec(pathname);
      if (!ex) {
        continue;
      }
      match = true;
      const args = ex.slice(1).map(decode);
      req.params = {};
      for (let j = 0; j < keys.length; j++) {
        req.params[keys[j].name] = args[j];
      }
      try {
        el.fn(req, res);
      } catch (e) {
        this._errFn(req, res, e);
      }
      break;
    }
    if (!match) {
      const error = new Error("Not Found");
      error.code = 404;
      res.odataError(error);
    }
  }
};
methods.forEach((m) => {
  Router.prototype[m] = function(route, fn) {
    this.routes[m].push({
      route: this.prefix + route,
      fn
    });
  };
});

// src/class/ODataServer.js
var ODataServer = class extends EventEmitter {
  constructor(serviceUrl) {
    this.serviceUrl = serviceUrl;
    this.cfg = {
      serviceUrl,
      afterRead: function() {
      },
      beforeQuery: function(col, query2, req, cb) {
        cb();
      },
      executeQuery: ODataServer.prototype.executeQuery.bind(this),
      beforeInsert: function(col, query2, req, cb) {
        cb();
      },
      executeInsert: ODataServer.prototype.executeInsert.bind(this),
      beforeUpdate: function(col, query2, update2, req, cb) {
        cb();
      },
      executeUpdate: ODataServer.prototype.executeUpdate.bind(this),
      beforeRemove: function(col, query2, req, cb) {
        cb();
      },
      executeRemove: ODataServer.prototype.executeRemove.bind(this),
      base64ToBuffer: ODataServer.prototype.base64ToBuffer.bind(this),
      bufferToBase64: ODataServer.prototype.bufferToBase64.bind(this),
      pruneResults: ODataServer.prototype.pruneResults.bind(this),
      addCorsToResponse: ODataServer.prototype.addCorsToResponse.bind(this)
    };
  }
  handle(req, res) {
    if (!this.cfg.serviceUrl && !req.protocol) {
      throw new Error("Unable to determine service url from the express request or value provided in the ODataServer constructor.");
    }
    function escapeRegExp(str) {
      return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }
    const path = (req.originalUrl || "/").replace(new RegExp(escapeRegExp(req.url) + "$"), "");
    this.cfg.serviceUrl = this.serviceUrl ? this.serviceUrl : req.protocol + "://" + req.get("host") + path;
    const prefix = url2.parse(this.cfg.serviceUrl).pathname;
    if (!this.router || prefix !== this.router.prefix) {
      this.router = new Router(prefix);
      this._initializeRoutes();
    }
    this.router.dispatch(req, res);
  }
  _initializeRoutes() {
    const self = this;
    this.router.get("/$metadata", function(req, res) {
      const result = metadata(self.cfg);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/xml");
      res.setHeader("DataServiceVersion", "4.0");
      res.setHeader("OData-Version", "4.0");
      self.cfg.addCorsToResponse(res);
      return res.end(result);
    });
    this.router.get("/:collection/$count", function(req, res) {
      req.params.$count = true;
      query(self.cfg, req, res);
    });
    this.router.get("/:collection\\(:id\\)", function(req, res) {
      query(self.cfg, req, res);
    });
    this.router.get("/:collection", function(req, res) {
      query(self.cfg, req, res);
    });
    this.router.get("/", function(req, res) {
      const result = collections(self.cfg);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      self.cfg.addCorsToResponse(res);
      return res.end(result);
    });
    this.router.post("/:collection", function(req, res) {
      insert(self.cfg, req, res);
    });
    this.router.patch("/:collection\\(:id\\)", function(req, res) {
      update(self.cfg, req, res);
    });
    this.router.delete("/:collection\\(:id\\)", function(req, res) {
      remove(self.cfg, req, res);
    });
    if (this.cfg.cors) {
      this.router.options("/(.*)", function(req, res) {
        res.statusCode = 200;
        res.setHeader("Access-Control-Allow-Origin", self.cfg.cors);
        res.end();
      });
    }
    this.router.error(function(req, res, error) {
      function def(e) {
        self.emit("odata-error", e);
        res.statusCode = error.code && error.code >= 100 && error.code < 600 ? error.code : 500;
        res.setHeader("Content-Type", "application/json");
        self.cfg.addCorsToResponse(res);
        res.end(JSON.stringify({
          error: {
            code: error.code || 500,
            message: e.message,
            stack: e.stack,
            target: req.url,
            details: []
          },
          innererror: {}
        }));
      }
      if (self.cfg.error) {
        self.cfg.error(req, res, error, def);
      } else {
        def(error);
      }
    });
  }
  error(fn) {
    this.cfg.error = fn.bind(this);
    return this;
  }
  query(fn) {
    this.cfg.query = fn.bind(this);
    return this;
  }
  cors(domains) {
    this.cfg.cors = domains;
    return this;
  }
  beforeQuery(fn) {
    if (fn.length === 3) {
      console.warn("Listener function should accept request parameter.");
      const origFn = fn;
      fn = function(col, query2, req, cb) {
        origFn(col, query2, cb);
      };
    }
    this.cfg.beforeQuery = fn.bind(this);
    return this;
  }
  executeQuery(col, query2, req, cb) {
    const self = this;
    this.cfg.beforeQuery(col, query2, req, function(err) {
      if (err) {
        return cb(err);
      }
      self.cfg.query(col, query2, req, function(err2, res) {
        if (err2) {
          return cb(err2);
        }
        self.cfg.afterRead(col, res, req);
        cb(null, res);
      });
    });
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
      fn = function(col, query2, update2, req, cb) {
        origFn(col, query2, update2, cb);
      };
    }
    this.cfg.beforeUpdate = fn.bind(this);
    return this;
  }
  executeUpdate(col, query2, update2, req, cb) {
    const self = this;
    this.cfg.beforeUpdate(col, query2, update2, req, function(err) {
      if (err) {
        return cb(err);
      }
      self.cfg.update(col, query2, update2, req, cb);
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
      fn = function(col, query2, req, cb) {
        origFn(col, query2, cb);
      };
    }
    this.cfg.beforeRemove = fn.bind(this);
    return this;
  }
  executeRemove(col, query2, req, cb) {
    const self = this;
    this.cfg.beforeRemove(col, query2, req, function(err) {
      if (err) {
        return cb(err);
      }
      self.cfg.remove(col, query2, req, cb);
    });
  }
  afterRead(fn) {
    this.cfg.afterRead = fn;
    return this;
  }
  model(model) {
    this.cfg.model = model;
    return this;
  }
  adapter(adapter) {
    adapter(this);
    return this;
  }
  pruneResults(collection, res) {
    prune(this.cfg.model, collection, res);
  }
  base64ToBuffer(collection, doc) {
    const model = this.cfg.model;
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
        doc[prop] = Buffer.from(doc[prop], "base64");
      }
    }
  }
  bufferToBase64(collection, res) {
    const model = this.cfg.model;
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
  addCorsToResponse(res) {
    if (this.cfg.cors) {
      res.setHeader("Access-Control-Allow-Origin", this.cfg.cors);
    }
  }
};

// src/index.js
var src_default = (options) => new ODataServer(options);
export {
  src_default as default
};
//# sourceMappingURL=index.js.map
