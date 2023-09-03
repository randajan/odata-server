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
const _pull = async (vals, method, context, to)=>{
    const ent = await context.fetchEntity();
    const tpv = typeof vals;
    if (tpv !== "function" && tpv !== "object") { return to; }
    if (typeof to !== "object") { to = {}; }

    await ent.forProps(async (prop, i)=>{
        if (!prop.key && !await context.filter(ent.name, i)) { return; }
        const val = prop.convert(tpv === "function" ? await vals(i) : vals[i], method, context);
        if (val !== undefined) { to[i] = val; }
    });

    return to;
}

export const pullBody = async (vals, method, context, to)=>{
    const toArray = Array.isArray(to);
    vals = (toArray === Array.isArray(vals)) ? vals : toArray ? [vals] : vals[0];
    if (!toArray) { return _pull(vals, method, context, to); }
    await Promise.all(vals.map(async raw=>{
        const val = await _pull(raw, method, context);
        if (val) { to.push(val); }
    }));
    return to;
}