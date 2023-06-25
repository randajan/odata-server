// src/mods/responder/Express.js
import jet from "@randajan/jet-core";
var { solid } = jet.prop;
var ExpressResponder = class {
  constructor(request, response) {
    solid.all(this, { request, response });
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
    const headers = jet.json.from(req.headers);
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
export {
  ExpressResponder,
  Express_default as default
};
//# sourceMappingURL=Express.js.map
