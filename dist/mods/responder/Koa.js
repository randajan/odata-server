// src/mods/responder/Koa.js
import jet from "@randajan/jet-core";
var { solid } = jet.prop;
var KoaResponder = class {
  constructor(context) {
    solid.all(this, { context });
  }
  getURL() {
    return this.context.request.url;
  }
  getMethod() {
    return this.context.request.method;
  }
  async getBody() {
    const ctx = this.context;
    const req = ctx.request;
    const body = ctx.body || req.body;
    if (body) {
      return body;
    }
    return new Promise((res, rej) => {
      let body2 = "";
      req.on("data", (data) => {
        if ((body2 += data).length > 1e6) {
          rej({ statusCode: 400, msg: "Request is too long" });
        }
      });
      req.on("end", (_) => {
        try {
          res(body2 ? JSON.parse(body2) : void 0);
        } catch (e) {
          rej({ statusCode: 400, msg: e.message });
        }
      });
    });
  }
  getType() {
    const accepts = this.context.accepts(["json", "xml"]);
    if (!Array.isArray(accepts)) {
      return;
    }
    const xml = accepts.includes("xml");
    const json = accepts.includes("json");
    if (xml !== json) {
      return xml ? "xml" : "json";
    }
  }
  setHeader(name, value) {
    this.context.set(name, value);
  }
  setBody(statusCode, body) {
    this.context.status = statusCode;
    this.context.body = body;
  }
};
var Koa_default = (ctx) => new KoaResponder(ctx);
export {
  KoaResponder,
  Koa_default as default
};
//# sourceMappingURL=Koa.js.map
