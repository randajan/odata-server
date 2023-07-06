import jet from "@randajan/jet-core";

import { propTypes } from "../consts";
import { unwrap } from "../tools";

const { solid } = jet.prop;

const convert = (prop, vals, method, context, subCollection)=> {
    const { isCollection, complex, primitive, name, model } = prop;
    if (name.startsWith("@odata")) { return; }

    if (!subCollection && isCollection) {
        return (Array.isArray(vals) ? vals : [vals]).map(v=>convert(prop, v, method, context, true));
    }

    if (complex) { return complex[method](vals); }

    return model.convert[primitive](vals, method, context);
}

export class ModelProp {

    constructor(model, msg, name, attrs) {

        solid(this, "model", model, false);
        solid(this, "name", name);

        attrs = Object.jet.to(attrs);
        for (const i in attrs) { solid(this, i, attrs[i]); }

        if (!this.type) { throw Error(msg(`missing!`, name, "type")); }

        const unCollection = unwrap(this.type, "Collection(", ")");
        solid(this, "isCollection", !!unCollection);

        const complexName = unwrap(unCollection || this.type, model.namespace+".");
        const complex = model.complexTypes[complexName];
        if (complexName && !complex) { throw Error(msg(`definition missing at 'model.complexTypes.${complexName}'`, name, "type")); }

        solid(this, "primitive", complex ? undefined : (unCollection || this.type));
        solid(this, "complex", complex);

        if (!complex && !propTypes.includes(this.primitive)) {
            throw Error(msg(`invalid value '${this.type}' - accepts one of: '${propTypes.join(", ")}'`, name, "type"));
        }

    }

    convert(val, method, context) {
        return convert(this, val, method, context);
    }


    toAdapter(val, context) {
        return this.convert(val, "toAdapter", context);
    }

    toResponse(val, context) {
        return this.convert(val, "toResponse", context);
    }

}