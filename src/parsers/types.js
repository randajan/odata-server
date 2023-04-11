import jet from "@randajan/jet-core";

const { cached } = jet.prop;

const validateChildDefault = (model, msg, name, child)=>child;

export const assignPack = (obj, model, msg, name, childs, validateChild)=>{
    const _p = {};
    const _msg = (text, ...path)=>msg(text, name, ...path);

    validateChild = validateChild || validateChildDefault;
    childs = Object.jet.to(childs);
    for (let name in childs) {
        const child = childs[name];
        cached(obj, _p, name, _=>validateChild(model, _msg, name, child));
    }

    return obj;
}

const convert = (method, props, vals, isOne)=>{
    vals = (!isOne && !Array.isArray(vals)) ? [vals] : vals;
    if (!isOne) { return vals.map(val=>convert(method, props, val, true)); }
    const r = {};

    if (typeof vals === "object") {
        for (let i in vals) {
            const prop = props[i];
            if (!prop) { continue; }
            const val = prop[method](vals[i]);
            if (val !== undefined) { r[i] = val; }
        }
    }

    return r;
}

export const convertToAdapter = (props, vals, isOne=true)=>convert("toAdapter", props, vals, isOne);
export const convertToResponse = (props, vals, isOne=true)=>convert("toResponse", props, vals, isOne);