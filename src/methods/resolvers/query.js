import jet from "@randajan/jet-core";

import { vault } from '../../tools.js';

export default async (req, res, resolver) => {
  const { context } = req;

  const { server, params:{ collection }, options, keys } = context;

  const result = await resolver("query", context);

  res.setHeader('Content-Type', 'application/json;odata.metadata=minimal');

  let out = {};
  // define the @odataContext in case of selection
  let sAdditionIntoContext = '';
  const oSelect = options.$select;
  
  if (oSelect) {
    const countProp = Object.keys(oSelect).length
    let ctr = 1
    for (const key in oSelect) {
      sAdditionIntoContext += key.toString() + (ctr < countProp ? ',' : '')
      ctr++
    }
  }

  if (!options.$filter._id) {
    sAdditionIntoContext = sAdditionIntoContext.length > 0 ? '(' + sAdditionIntoContext + ')/$entity' : '/$entity'
    out['@odata.context'] = server.url + '/$metadata#' + collection + sAdditionIntoContext
    if (result.length > 0) {
      for (const key in result[0]) {
        out[key] = result[0][key]
      }
    }
  } else {
    sAdditionIntoContext = sAdditionIntoContext.length > 0 ? '(' + sAdditionIntoContext + ')' : ''
    out = {
      '@odata.context': server.url + '/$metadata#' + collection + sAdditionIntoContext,
      value: result
    }
  }

  if (options.$inlinecount) {
    out['@odata.count'] = result.count;
    out.value = result.value;
  }

  server.pruneResults(collection, out.value);
  server.bufferToBase64(collection, out.value);

  return JSON.stringify(out);
}
