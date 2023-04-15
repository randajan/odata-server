import jet from "@randajan/jet-core";


export default async (context, res) => {
  const count = Math.max(0, Number.jet.to(await context.fetchResponseBodyRaw()));
  const { $select } = await context.fetchOptions();

  const out = {
    '@odata.context':context.getScopeMeta($select ? Object.keys($select) : ""),
    '@odata.count':count,
    value:count
  };

  res.setHeader('Content-Type', 'application/json;odata.metadata=minimal');
  res.stateCode = 200;
  res.end(JSON.stringify(out));
}
