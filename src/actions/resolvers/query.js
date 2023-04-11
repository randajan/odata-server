import jet from "@randajan/jet-core";


export default async (req, res, raw) => {
  const { context } = req;
  const {options:{ $select, $filter, $inlinecount }, entity:{ primaryKey, props } } = context;

  let out = {};
  if ($filter.hasOwnProperty(primaryKey)) {
    out['@odata.context'] = context.getScopeMetaEntity($select ? Object.keys($select) : "");
    if (raw.length) { Object.assign(out, props.toResponse(raw[0])); }
  } else {
    out['@odata.context'] = context.getScopeMeta($select ? Object.keys($select) : "");
    out.value = props.toResponse(raw, false);
  }

  if ($inlinecount) {
    out['@odata.count'] = raw.count;
    out.value = raw.value;
  }

  res.setHeader('Content-Type', 'application/json;odata.metadata=minimal');
  res.stateCode = 200;
  res.end(JSON.stringify(out));
}
