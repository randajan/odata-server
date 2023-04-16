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

//filter:props
const _pull = async (method, context, vals, to)=>{
    const { name, props } = await context.fetchEntity();
    if (typeof vals !== "object") { return to; }
    if (typeof to !== "object") { to = {}; }
    for (let i in vals) {
        const prop = props[i];
        if (!prop) { continue; }
        if (!prop.key && !await context.filter(name, i)) { continue; }
        const val = prop[method](vals[i]);
        if (val !== undefined) { to[i] = val; }
    }
    return to;
}

export const pullBody = async (context, to, vals, method)=>{
    const toArray = Array.isArray(to);
    vals = (toArray === Array.isArray(vals)) ? vals : toArray ? [vals] : vals[0];
    if (!toArray) { return _pull(method, context, vals, to); }
    for (const raw of vals) {
        const val = await _pull(method, context, raw);
        if (val) { to.push(val); }
    }
    return to;
}