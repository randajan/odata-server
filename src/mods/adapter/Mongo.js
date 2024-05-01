import { ObjectId } from "mongodb";
import jet from "@randajan/jet-core";
import { map } from "@randajan/jet-core/eachSync";

const { solid } = jet.prop;

export class MongoAdapter {

    constructor(connect) {
        solid(this, "connect", connect, false);
    }

    optValidator(val, ctx, entity) { return (ctx.key === entity.primaryKey) ? ObjectId(val) : val; }
    optValidate(opt, entity) { return map(opt, (val, ctx)=>this.optValidator(val, ctx, entity), { deep:true }); }

    async getDB(context) {
        return (await this.connect(context)).db(context.model.namespace);
    }

    async getCollection(context) {
        return (await this.getDB(context)).collection(context.params.entity);
    }

    async remove(context) {
        const entity = await context.fetchEntity();
        const options = await context.fetchOptions();
        const { $filter } = this.optValidate({ $filter:options.$filter }, entity);

        const col = await this.getCollection(context);
        const res = await col.deleteOne($filter);
    
        return res.deletedCount;
    }
    
    async update(context) {
        const entity = await context.fetchEntity();
        const options = await context.fetchOptions();
        const { $filter } = this.optValidate({ $filter:options.$filter }, entity);

        const col = await this.getCollection(context);
        const res = await col.updateOne($filter, {$set:await context.pullRequestBody({})});
    
        return res.matchedCount;
    }
    
    async insert(context) {
        const { primaryKey } = await context.fetchEntity();
        const body = await context.pullRequestBody({});

        if (primaryKey !== "_id" && !body[primaryKey]) { body[primaryKey] = jet.uid(16); }
    
        const col = await this.getCollection(context);
        const value = await col.insertOne(body);
    
        return col.findOne({ _id: value.insertedId });
    }
    
    async query(context) {
        const entity = await context.fetchEntity();
        const options = await context.fetchOptions();
        const { $select, $sort, $skip, $limit, $filter } = this.optValidate(options, entity);

        const col = await this.getCollection(context);
        let qr = col.find($filter, { projection: $select || {} });
    
        if ($sort) { qr = qr.sort($sort); }
        if ($skip) { qr = qr.skip($skip); }
        if ($limit) { qr = qr.limit($limit); }

        return qr.toArray();
    
    }

    async count(context) {
        return (await this.query(context)).length;
    }

}


export default connect=>new MongoAdapter(connect);
