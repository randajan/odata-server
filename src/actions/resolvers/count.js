import jet from "@randajan/jet-core";


export default async (req, res, raw) => {
  const { context } = req;
  const { options:{ $select } } = context;

  const count = Math.max(0, Number.jet.to(raw));

  const out = {
    '@odata.context':context.getScopeMeta($select ? Object.keys($select) : ""),
    '@odata.count':count,
    value:count
  };

  res.setHeader('Content-Type', 'application/json;odata.metadata=minimal');
  res.stateCode = 200;
  res.end(JSON.stringify(out));
}
