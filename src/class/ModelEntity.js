import { unwrap } from "../tools";

import { solid } from "@randajan/props";


export class ModelEntity {

    constructor(model, msg, name, attrs) {

        solid(this, "model", model, false);
        solid(this, "name", name);


        attrs = Object.jet.to(attrs);
        for (const i in attrs) { solid(this, i, attrs[i]); }

        const entityType = this.entityType;

        if (!entityType) { throw Error(msg(`missing!`, name, "entityType")); }

        const typeName = unwrap(entityType, model.namespace + ".");
        if (!typeName) { throw Error(msg(`missing namespace '${model.namespace}' prefix`, name, "entityType")); }
        const props = model.entityTypes[typeName];
        if (!props) { throw Error(msg(`definition missing at 'model.entityTypes.${typeName}'`, name, "entityType")); }

        solid(this, "props", props);
        solid(this, "propsList", Object.keys(props));

        for (const propName in props) {
            if (!props[propName].key) { continue; }
            if (this.primaryKey) { throw Error(msg(`primaryKey is allready defined as ${this.primaryKey}`, name, propName)); }
            solid(this, "primaryKey", propName);
        }

        if (!this.primaryKey) { throw Error(msg(`primaryKey is missing`, name)); }

    }

    async forProps(callback) {
        await Promise.all(this.propsList.map(i=>callback(this.props[i], i)));
    }

    async mapProps(callback, byKey = false) {
        
        const res = byKey ? {} : [];

        await this.forProps(async (prop, i)=>{
            const r = await callback(prop, i);
            if (r === undefined ) { return; }
            if (byKey) { res[i] = r; } else { res.push(r); }
        });

        return res;
    }

}