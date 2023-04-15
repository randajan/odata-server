
import jet from "@randajan/jet-core";

export const vault = jet.vault("ODataServer");


export const escapeRegExp = str=>new RegExp(str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&') + '$');



export const withBrackets = (val, quote="")=>{
    const str = String.jet.to(val, quote+","+quote);
    return str ? "("+quote+str+quote+")" : "";
}

export const getScope = (collection, ids, quote="")=>collection + withBrackets(ids, quote);
export const getScopeMeta = (collection, ids, quote="")=>"$metadata#"+getScope(collection, ids, quote);


export const isWrapped = (str, prefix="", suffix="")=>typeof str === "string" ? str.startsWith(prefix) && str.endsWith(suffix) : false;
export const unwrap = (str, prefix="", suffix="")=>isWrapped(str = String.jet.to(str), prefix, suffix) ? str.slice(prefix.length, str.length - suffix.length) : "";