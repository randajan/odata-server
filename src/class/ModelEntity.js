import jet from "@randajan/jet-core";

import { unwrap } from "../tools";
import { ModelPack } from "./ModelPack";

const { solid, cached } = jet.prop;

export class ModelEntity extends ModelPack {
    constructor(parent, name, attrs) {
        super(parent, name, attrs);

        const model = parent.parent;
        const namespace = model.namespace;
        const entityType = this.entityType;

        if (!entityType) { throw Error(this.msg(`missing!`, "entityType")); }

        const typeName = unwrap(entityType, namespace+".");
        if (!typeName) { throw Error(this.msg(`missing namespace '${ namespace }' prefix`, "entityType")); }
        const props = model.entityTypes[typeName];
        if (!props) { throw Error(this.msg(`definition missing at 'model.entityTypes.${typeName}'`, "entityType")); }

        solid(this, "props", props);

        for (const propName in props) {
            if (!props[propName].key) { continue; }
            if (this.primaryKey) { throw Error(this.msg(`primaryKey is allready defined as ${this.primaryKey}`, propName)); }
            solid(this, "primaryKey", propName);
        }

        if (!this.primaryKey) { throw Error(this.msg(`primaryKey is missing`)); }

    }

}