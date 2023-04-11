import jet from "@randajan/jet-core";

import { isWrapped, unwrap } from "../tools";
import { ModelPack } from "./ModelPack";
import { ModelProp } from "./ModelProp";
import { ModelType } from "./ModelType";
import { ModelEntity } from "./ModelEntity";
import { propTypes } from "../consts";

const { solid, cached } = jet.prop;

const createProp = (type, name, attrs)=>new ModelProp(type, name, attrs);
const createEntity = (sets, name, attrs)=>new ModelEntity(sets, name, attrs);
const createType = (types, name, props)=>new ModelType(types, name, props, createProp);

export class Model {

    constructor(server, model, converter) {
        const { namespace, entityTypes, entitySets, complexTypes } = Object.jet.to(model);

        solid(this, "server", server, false);
        solid(this, "namespace", String.jet.to(namespace));

        if (!this.namespace) { throw Error(this.msg("namespace missing")); }

        solid(this, "complexTypes", new ModelPack(this, "complexTypes", complexTypes, createType));
        solid(this, "entityTypes", new ModelPack(this, "entityTypes", entityTypes, createType));
        solid(this, "entitySets", new ModelPack(this, "entitySets", entitySets, createEntity));
        solid(this, "converter", {}, false);

        const csr = jet.isRunnable(converter);
        if (!csr) { converter = Object.jet.to(converter); }

        propTypes.map(t=>{
            const fce = csr ? (v, method)=>converter(t, v, method) : jet.isRunnable(converter[t]) ? converter[t] : v=>v;
            solid(this.converter, t, fce);
        });
        
        
    }

    msg(text, ...path) {
        path = path.join(".") || "";
        if (path) { path = "."+path; }
        return this.server.msg("model" + path + " " + text);
    }

    checkNamespace(str) { return isWrapped(str, this.namespace+"."); }
    stripNamespace(str) { return unwrap(str, this.namespace+"."); }

}