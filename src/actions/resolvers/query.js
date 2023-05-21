export default async context=> {
  const { responder, params} = context;
  const { primaryKey } = await context.fetchEntity();
  const { $select, $count } = await context.fetchOptions();

  let out = {};

  if (params.hasOwnProperty("id")) {
    out["@odata.context"] = context.getScopeMetaEntity($select ? Object.keys($select) : "");
    await context.pullResponseBody(out);
    if (!out.hasOwnProperty(primaryKey)) { throw {code:404, msg:"Not found"}; }
  } else {
    out["@odata.context"] = context.getScopeMeta($select ? Object.keys($select) : "");
    const value = await context.pullResponseBody([]);
    if ($count) { out["@odata.count"] = value.length; }
    out.value = value;
  }

  responder.setHeader("Content-Type", "application/json;odata.metadata=minimal");
  return responder.setBody(200, JSON.stringify(out));

}
