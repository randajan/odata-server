import jet from "@randajan/jet-core";

import { ModelPack } from "./ModelPack";

const convert = (type, method, vals, isOne)=>{
    vals = (!isOne && !Array.isArray(vals)) ? [vals] : vals;
    if (!isOne) { return vals.map(val=>convert(type, method, val, true)); }
    const r = {};

    if (typeof vals === "object") {
        for (let i in vals) {
            const prop = type[i];
            if (!prop) { continue; }
            const val = prop[method](vals[i]);
            if (val !== undefined) { r[i] = val; }
        }
    }

    return r;
}

export class ModelType extends ModelPack {

    toAdapter(vals, isOne=true) {
        return convert(this, "toAdapter", vals, isOne);
    }

    toResponse(vals, isOne=true) {
        return convert(this, "toResponse", vals, isOne);
    }
}