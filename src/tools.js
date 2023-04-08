
import jet from "@randajan/jet-core";

export const vault = jet.vault("ODataServer");


export const escapeRegExp = str=>str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');