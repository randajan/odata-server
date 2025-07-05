
import { parse as urlParser } from "url";
import builder from 'xmlbuilder';
import { solid } from "@randajan/props";


export const vault = new WeakMap();


export const withBrackets = (val, quote="")=>{
    const str = String.jet.to(val, quote+","+quote);
    return str ? "("+quote+str+quote+")" : "";
}

export const getScope = (entity, ids, quote="")=>entity + withBrackets(ids, quote);
export const getScopeMeta = (entity, ids, quote="")=>"$metadata#"+getScope(entity, ids, quote);


export const isWrapped = (str, prefix="", suffix="")=>typeof str === "string" ? str.startsWith(prefix) && str.endsWith(suffix) : false;
export const unwrap = (str, prefix="", suffix="")=>isWrapped(str = String.jet.to(str), prefix, suffix) ? str.slice(prefix.length, str.length - suffix.length) : "";

export const trimUrl = pathname=>pathname.endsWith("/") ? pathname.slice(0, pathname.length-1) : pathname;

export const parseUrl = (url, parseQueryString=false)=>{
    url = urlParser(String.jet.to(url) || "/", parseQueryString);
    solid(url, "base", ((!url.host ? "" : (!url.protocol ? "" : url.protocol+"//")+url.host) + trimUrl(url.pathname)));
    solid(url, "toString", _=>url.base, false);
    return url;
}

export const decodeParam = param=>param && decodeURIComponent(param).replace(/(^["'`]+)|(["'`]+$)/g, "");

const _knownBodyTypes = ["json", "xml"];
export const setResponderBody = (responder, body, defaultType="json", extraType="")=>{
    let type = responder.getType();
    if (!type || !_knownBodyTypes.includes(type)) { type = defaultType; }

    responder.setHeader("Content-Type", `application/${type}` + (extraType ? ";"+extraType : ""));
    const out = type === "json" ? JSON.stringify(body) : builder.create(body).end({ pretty: true });
    return responder.setBody(200, out);
}