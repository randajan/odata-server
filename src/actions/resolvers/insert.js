
export default async (context, res) => {

  const { primaryKey } = await context.fetchEntity();
  const rawBody = await context.fetchResponseBodyRaw();
  const id = rawBody[primaryKey];

  const out = {};
  out['@odata.context'] = context.getScopeMetaEntity();
  out['@odata.id'] = out['@odata.editLink'] = context.getScope(id, "'");

  await context.pullResponseBody(out);

  res.setHeader('Content-Type', 'application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false;charset=utf-8');
  res.setHeader('Location', context.getScope(encodeURI(id), "'"));
  res.statusCode = 201;

  res.end(JSON.stringify(out));
  
};


