import jet from "@randajan/jet-core";

const { solid, cached } = jet.prop;

const validateChildDefault = (parent, name, child)=>child;

export class ModelPack {

    constructor(parent, name, childs, validateChild) {
        const _p = {};

        solid(this, "name", name, false);
        solid(this, "parent", parent, false);
        validateChild = validateChild || validateChildDefault;
        childs = Object.jet.to(childs);
        for (let name in childs) {
            const child = childs[name];
            cached(this, _p, name, _=>validateChild(this, name, child));
        }
    }

    msg(text, ...path) {
        return this.parent.msg(text, this.name, ...path);
    }

    toString() {
        return this.name;
    }

}