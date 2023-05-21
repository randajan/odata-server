export default async context=> {
  const { responder } = context;
  
  const count = Math.max(0, Number.jet.to(await context.fetchResponseBodyRaw()));
  const { $select } = await context.fetchOptions();

  const out = {
    "@odata.context":context.getScopeMeta($select ? Object.keys($select) : ""),
    "@odata.count":count,
    value:count
  };

  responder.setHeader("Content-Type", "application/json;odata.metadata=minimal");
  return responder.setBody(200, JSON.stringify(out));

}
