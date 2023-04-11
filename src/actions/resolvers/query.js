import jet from "@randajan/jet-core";
import { convertToResponse } from "../../parsers/types";


export default async (req, res, raw) => {
  const { context } = req;
  const {options:{ $select, $count }, entity:{ props } } = context;

  let out = {};

  if (props.hasOwnProperty("id")) {
    out['@odata.context'] = context.getScopeMetaEntity($select ? Object.keys($select) : "");
    if (raw.length) { Object.assign(out, convertToResponse(props, raw[0])); }
  } else {
    out['@odata.context'] = context.getScopeMeta($select ? Object.keys($select) : "");
    raw = convertToResponse(props, raw, false);
    if ($count) { out['@odata.count'] = raw.length; }
    out.value = raw;
  }

  res.setHeader('Content-Type', 'application/json;odata.metadata=minimal');
  res.stateCode = 200;
  res.end(JSON.stringify(out));
}
