
import parser from 'odata-parser';
import querystring from 'querystring';
import jet from "@randajan/jet-core";

const { solid } = jet.prop;

const _allowedQueryOptions = ['$', '$expand', '$filter', '$format', '$inlinecount', '$select', '$skip', '$top', '$orderby'];

// odata parser returns ['null', ''] for a filter with "field eq null"
// we handle the case by fixing the query in case this happens
const filterBug = val=>(Array.isArray(val) && val.length === 2 && val[0] === 'null' && val[1] === '') ? null : val;

const parseOp = (op, left, right, func, args)=>{
  const r = op || [];
  r.push(parseNode(left, func, args));
  r.push(parseNode(right, func, args));
  return r;
}

const parseSort = orderBy => {
  const r = {};
  if (!orderBy) { return r; }
  for (const prop of orderBy) {
    const propName = Object.keys(prop)[0];
    r[propName] = prop[propName] === 'desc' ? -1 : 1;
  }
  return r;
}

const parseSelect = select => {
  const r = {};
  if (!select) { return r; }
  for (const prop of select) { r[prop] = 1; }
  return r;
}

const parseFilter = filter => {
  if (!filter) { return {}; }
  const { type, left, right, func, args } = filter;
  return parseNode({ type, left, right }, func, args);
}


const substringof = (args, result) => {

  const prop = args[0].type === 'property' ? args[0] : args[1];
  const lit = args[0].type === 'literal' ? args[0] : args[1];

  result[prop.name] = new RegExp(lit.value);
}

const _pushProp = (result, left, rightValue) => {
  if (left.type !== 'property' || left.name.indexOf('/') === -1) { return result[left.name] = rightValue; }

  const fragments = left.name.split('/');
  const obj = result[fragments[0]] || {};

  for (let i = 1; i < fragments.length; i++) {
    if (i === (fragments.length - 1)) {
      obj[fragments[i]] = rightValue
    } else {
      obj[fragments[i]] = obj[fragments[i]] || {}
    }
  }

  return result[fragments[0]] = obj;
}

const parseNode = ({ type, left, right }, func, args) => {
  const result = {};
  const pushProp = rightValue=>_pushProp(result, left, rightValue);

  if (right.type === "literal") {
    if (type === 'eq') { pushProp(filterBug(right.value)); }
    if (type === 'lt') { pushProp({ $lt: right.value }); }
    if (type === 'gt') { pushProp({ $gt: right.value }); }
    if (type === 'le') { pushProp({ $lte: right.value }); }
    if (type === 'ge') { pushProp({ $gte: right.value }); }
    if (type === 'ne') { pushProp({ $ne:filterBug(right.value) }); }
  }

  if (type === 'and') { result.$and = parseOp(result.$and, left, right, func, args); }
  if (type === 'or') { result.$or = parseOp(result.$or, left, right, func, args); }
  if (type === 'functioncall') {
    switch (func) {
      case 'substringof': substringof(args, result)
    }
  }

  return result;
}

const queryTransform = (query) => {

  if (query.$top) { query.$limit = query.$top; }
  if (query.$inlinecount === 'allpages') { query.$count = true; }

  query.$sort = parseSort(query.$orderby);
  query.$filter = parseFilter(query.$filter);
  query.$select = parseSelect(query.$select);

  return query;
}

export const parseOptions = (url, params) => {
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

  if (params.count) { r.$count = true; }
  if (params.id) { r.$filter._id = params.id; }

  return r;
}