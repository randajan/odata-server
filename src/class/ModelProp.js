import jet from "@randajan/jet-core";

import { propTypes } from "../consts";
import { unwrap } from "../tools";
import { ModelPack } from "./ModelPack";

const { solid } = jet.prop;

const convert = (prop, method, vals, subCollection)=> {
    const { isCollection, complex, primitive, name } = prop;
    if (name.startsWith("@odata")) { return; }

    if (!subCollection && isCollection) {
        return (Array.isArray(vals) ? vals : [vals]).map(v=>convert(prop, method, v, true));
    }

    if (complex) { return complex[method](vals); }

    return prop.parent.parent.parent.converter[primitive](vals, method);
}

export class ModelProp extends ModelPack {

    constructor(parent, name, attrs) {
        super(parent, name, attrs);

        const model = parent.parent.parent;
        const namespace = model.namespace;
        const type = this.type;

        if (!type) { throw Error(this.msg(`missing!`, "type")); }

        const unCollection = unwrap(type, "Collection(", ")");
        solid(this, "isCollection", !!unCollection);

        const complexName = unwrap(unCollection || type, namespace+".");
        const complex = model.complexTypes[complexName];
        if (complexName && !complex) { throw Error(this.msg(`definition missing at 'model.complexTypes.${complexName}'`, "type")); }

        solid(this, "primitive", complex ? undefined : (unCollection || type));
        solid(this, "complex", complex);

        if (!complex && !propTypes.includes(this.primitive)) {
            throw Error(this.msg(`invalid value '${this.type}' - accepts one of: '${propTypes.join(", ")}'`, "type"));
        }

    }


    toAdapter(val) {
        return convert(this, "toAdapter", val);
    }

    toResponse(val) {
        return convert(this, "toResponse", val);
    }

}