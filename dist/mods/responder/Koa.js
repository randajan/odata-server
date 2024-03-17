import "../../chunk-JC4IRQUL.js";

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
    return req.body;
  }
  getType() {
    const ctx = this.context;
    const json = ctx.accepts("json");
    const xml = ctx.accepts("xml");
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
