import query from "./query";

import jet from "@randajan/jet-core";


export default async (req, res) => {
  jet.prop.solid(req.context.params, "count", true);
  return query(req, res);
}