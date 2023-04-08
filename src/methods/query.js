import parser from 'odata-parser';
import querystring from 'querystring';
import jet from "@randajan/jet-core";

import { queryTransform } from '../validations/queryTransform.js';
import { vault } from '../tools.js';

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

  if (params.id) { r.$filter._id = params.id.replace(/["']/g, ''); }

  return r;
}


export const query = async (req, res) => {
  const { ods, params, url } = req.odata;
  const { resolver } = vault.get(ods.uid);
  const { collection } = params;

  if (!ods.model.entitySets[collection]) {
    const error = new Error('Entity set not Found');
    error.code = 404;
    res.odataError(error);
    return;
  }

  const queryOptions = parseOptions(url, params);

  const result = await resolver("query", req);

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json;odata.metadata=minimal')
  res.setHeader('OData-Version', '4.0')

  let out = {}
  // define the @odataContext in case of selection
  let sAdditionIntoContext = ''
  const oSelect = queryOptions.$select
  
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
    out['@odata.context'] = ods.url + '/$metadata#' + collection + sAdditionIntoContext
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
      '@odata.context': ods.url + '/$metadata#' + collection + sAdditionIntoContext,
      value: result
    }
  }

  if (queryOptions.$inlinecount) {
    out['@odata.count'] = result.count
    out.value = result.value
  }

  ods.pruneResults(collection, out.value);
  ods.bufferToBase64(collection, out.value);

  return JSON.stringify(out);
}
