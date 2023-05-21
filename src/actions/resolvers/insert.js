export default async context=> {
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


