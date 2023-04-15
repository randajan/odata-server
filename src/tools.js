
import { parse as urlParser } from "url";
import jet from "@randajan/jet-core";

const { solid } = jet.prop;

export const vault = jet.vault("ODataServer");


export const withBrackets = (val, quote="")=>{
    const str = String.jet.to(val, quote+","+quote);
    return str ? "("+quote+str+quote+")" : "";
}

export const getScope = (entity, ids, quote="")=>entity + withBrackets(ids, quote);
export const getScopeMeta = (entity, ids, quote="")=>"$metadata#"+getScope(entity, ids, quote);


export const isWrapped = (str, prefix="", suffix="")=>typeof str === "string" ? str.startsWith(prefix) && str.endsWith(suffix) : false;
export const unwrap = (str, prefix="", suffix="")=>isWrapped(str = String.jet.to(str), prefix, suffix) ? str.slice(prefix.length, str.length - suffix.length) : "";


export const parseUrl = (url, parseQueryString=true, baseUrl=undefined)=>{
    url = String.jet.to(url);
    if (baseUrl) { url = url.replace(new RegExp(`^((${baseUrl.protocol}//)?${baseUrl.host})?${baseUrl.pathname}`), ""); }
    url = urlParser(url, parseQueryString);
    solid(url, "base", (!url.host ? "" : (!url.protocol ? "" : url.protocol+"//")+url.host) + url.pathname);
    solid(url, "toString", _=>url.base, false);
    return url;
}