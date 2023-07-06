import jet from "@randajan/jet-core";

import { ModelProp } from "./ModelProp";
import { ModelEntity } from "./ModelEntity";
import { assignPack } from "../parsers/types";

import { propTypes } from "../consts";
import { isWrapped, unwrap } from "../tools";

const { solid } = jet.prop;

const createProp = (model, msg, name, attrs)=>new ModelProp(model, msg, name, attrs);
const createEntity = (model, msg, name, attrs)=>new ModelEntity(model, msg, name, attrs);
const createType = (model, msg, name, props)=>assignPack({}, model, msg, name, props, createProp);

export class Model {

    constructor(server, model, converter) {
        const { namespace, entityTypes, entitySets, complexTypes } = model;

        solid(this, "server", server, false);
        solid(this, "namespace", String.jet.to(namespace));

        if (!this.namespace) { throw Error(this.msg("namespace missing")); }

        const _msg = this.msg.bind(this);
        solid(this, "complexTypes", assignPack({}, this, _msg, "complexTypes", complexTypes, createType));
        solid(this, "entityTypes", assignPack({}, this, _msg, "entityTypes", entityTypes, createType));
        solid(this, "entitySets", assignPack({}, this, _msg, "entitySets", entitySets, createEntity));
        solid(this, "convert", {}, false);

        const csr = jet.isRunnable(converter);
        if (!csr) { converter = Object.jet.to(converter); }

        propTypes.map(t=>{
            const fce = csr ? (v, method, context)=>converter(t, v, method, context) : jet.isRunnable(converter[t]) ? converter[t] : v=>v;
            solid(this.convert, t, fce);
        });
        
        
    }

    msg(text, ...path) {
        path = path.join(".") || "";
        if (path) { path = "."+path; }
        return this.server.msg("model" + path + " " + text);
    }

    checkNamespace(str) { return isWrapped(str, this.namespace+"."); }
    stripNamespace(str) { return unwrap(str, this.namespace+"."); }

    findEntity(name) {
        const ent = this.entitySets[name];
        if (!ent) { throw Error(this.msg("not found!", "entitySets", name)); }
        return ent;
    }

}