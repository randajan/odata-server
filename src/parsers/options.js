import parser from 'odata-parser';
import querystring from 'querystring';
import jet from "@randajan/jet-core";

import { unwrap } from "../tools";
import { allowedQueryOptions } from '../consts';


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

const parseQuery = (url) => {
  let search = url.search;
  if (!search) { return; }

  let query = {};
  for (let k in url.query) {
    if (allowedQueryOptions.includes(k)) { query[k] = url.query[k]; }
  }

  //workaround v4 => v3
  if (Boolean.jet.to(query.$count)) {
    query["$inlinecount"] = "allpages";

    delete query.$count;
    search = querystring.stringify(query);

    if (!search) { return; }
  }

  search = decodeURIComponent((unwrap(search, "?") || search).replace(/\+/g, " "));
  
  query = search ? parser.parse(search) : {};

  if (query.$inlinecount != null) {
    query.$count = true;
    delete query.$inlinecount;
  }

  if (query.$top) { query.$limit = query.$top; }

  query.$sort = parseSort(query.$orderby);
  query.$filter = parseFilter(query.$filter);
  query.$select = parseSelect(query.$select);

  return query;
}



export const _fetchOptions = (url, params, primaryKey) => {
  const query = parseQuery(url) || { $filter: {} };

  if (params.count) { query.$count = true; }
  if (params.id) { query.$filter[primaryKey] = params.id; }

  return query;
}