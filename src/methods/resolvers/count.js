import query from "./query";

import jet from "@randajan/jet-core";



export default (req, res) => {
  jet.prop.solid(req.odata.params, "count", true);
  return query(req, res);
}