import { convertToResponse } from "../../parsers/types";


export default async (req, res, raw) => {
  const { context } = req;
  const { props, primaryKey } = context.entity;

  const id = raw[primaryKey];

  const out = {};
  out['@odata.context'] = context.getScopeMetaEntity();
  out['@odata.id'] = out['@odata.editLink'] = context.getScope(id, "'");

  Object.assign(out, convertToResponse(props, raw));

  res.setHeader('Content-Type', 'application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false;charset=utf-8');
  res.setHeader('Location', context.getScope(encodeURI(id), "'"));
  res.statusCode = 201;

  res.end(JSON.stringify(out));
  
};


