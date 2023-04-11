
const sortProperties = obj=>{
  const sortedKeys = Object.keys(obj).sort((a, b) => a.startsWith("@") ? -1 : b.startsWith("@") ? 1 : 0);
  const sortedObj = {};
  for (const key of sortedKeys) { sortedObj[key] = obj[key]; }
  return sortedObj;
}

export default async (req, res, raw) => {
  const { context } = req;
  const { props, primaryKey } = context.entity;

  let out = props.toResponse(raw);
  const id = out[primaryKey];

  // odata.context must be first
  out['@odata.id'] = out['@odata.editLink'] = context.getScope(id, "'");
  out['@odata.context'] = context.getScopeMetaEntity();
  out = sortProperties(out);

  res.setHeader('Content-Type', 'application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false;charset=utf-8');
  res.setHeader('Location', context.getScope(encodeURI(id), "'"));
  res.statusCode = 201;

  res.end(JSON.stringify(out));
  
};


