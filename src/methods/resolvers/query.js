import parser from 'odata-parser';
import querystring from 'querystring';
import jet from "@randajan/jet-core";

import { queryTransform } from '../../validations/queryTransform.js';
import { vault } from '../../tools.js';

const { solid } = jet.prop;


const _allowedQueryOptions = ['$', '$expand', '$filter', '$format', '$inlinecount', '$select', '$skip', '$top', '$orderby'];
const parseOptions = (url, params) => {
  const query = url.query;

  let r = { $filter: {} };

  if (url.search) {
    const queryValid = {}
    for (const opt of _allowedQueryOptions) {
      if (query[opt]) { queryValid[opt] = query[opt]; }
    }

    const encodedQS = decodeURIComponent(querystring.stringify(queryValid));
    if (encodedQS) { r = queryTransform(parser.parse(encodedQS)); }
    if (query.$count) { r.$inlinecount = true; }
  }

  r.collection = params.collection;
  if (params.count) { r.$count = true; }
  if (params.id) { r.$filter._id = params.id.replace(/["']/g, ''); }

  return r;
}


export default async (req, res) => {
  const { odata } = req;
  const { server, params, url } = odata;
  const { resolver } = vault.get(server.uid);
  const { collection } = params;

  if (!server.model.entitySets[collection]) {
    const error = new Error('Entity set not Found');
    error.code = 404;
    res.odataError(error);
    return;
  }

  const queryOptions = parseOptions(url, params);

  solid(req.odata, "options", queryOptions);

  const result = await resolver("query", req.odata);

  res.setHeader('Content-Type', 'application/json;odata.metadata=minimal')

  let out = {};
  // define the @odataContext in case of selection
  let sAdditionIntoContext = '';
  const oSelect = queryOptions.$select;
  
  if (oSelect) {
    const countProp = Object.keys(oSelect).length
    let ctr = 1
    for (const key in oSelect) {
      sAdditionIntoContext += key.toString() + (ctr < countProp ? ',' : '')
      ctr++
    }
  }

  if (Object.prototype.hasOwnProperty.call(queryOptions.$filter, '_id')) {
    sAdditionIntoContext = sAdditionIntoContext.length > 0 ? '(' + sAdditionIntoContext + ')/$entity' : '/$entity'
    out['@odata.context'] = server.url + '/$metadata#' + collection + sAdditionIntoContext
    if (result.length > 0) {
      for (const key in result[0]) {
        out[key] = result[0][key]
      }
    }
    // this shouldn't be done, but for backcompatibility we keep it for now
    out.value = result
  } else {
    sAdditionIntoContext = sAdditionIntoContext.length > 0 ? '(' + sAdditionIntoContext + ')' : ''
    out = {
      '@odata.context': server.url + '/$metadata#' + collection + sAdditionIntoContext,
      value: result
    }
  }

  if (queryOptions.$inlinecount) {
    out['@odata.count'] = result.count
    out.value = result.value
  }

  server.pruneResults(collection, out.value);
  server.bufferToBase64(collection, out.value);

  return JSON.stringify(out);
}
