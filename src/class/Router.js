import url from 'url';
import pathToRegexp from 'path-to-regexp';
import methods from 'methods';

const decode = val=>val && decodeURIComponent(val);

export class Router {
  constructor(prefix) {
    this.routes = {};
    this.prefix = prefix === '/' ? '' : prefix;
    methods.forEach(method=>this.routes[method] = []);
  }

  error(fn) {
    this._errFn = fn;
  }

  dispatch(req, res) {
    const m = req.method.toLowerCase()
    res.odataError = (err) => this._errFn(req, res, err);
  
    const { pathname } = url.parse(req.originalUrl || req.url);
    let match = false;
  
    for (const el of this.routes[m]) {
      const keys = [];
      const re = pathToRegexp(el.route, keys);
      const ex = re.exec(pathname);
  
      if (!ex) { continue; }

      match = true;
      const args = ex.slice(1).map(decode);
      req.params = {};
      for (let j = 0; j < keys.length; j++) {
        req.params[keys[j].name] = args[j]
      }

      try {
        el.fn(req, res)
      } catch (e) {
        this._errFn(req, res, e)
      }

      break;
    }
  
    if (!match) {
      const error = new Error('Not Found');
      error.code = 404;
      res.odataError(error);
    }
  }
}

methods.forEach(m=>{
  Router.prototype[m] = function (route, fn) {
    this.routes[m].push({
      route: this.prefix + route,
      fn
    })
  }
});