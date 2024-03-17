import "../../chunk-JC4IRQUL.js";

// src/mods/adapter/Mongo.js
import { ObjectId } from "mongodb";
import jet from "@randajan/jet-core";
var { solid } = jet.prop;
var MongoAdapter = class {
  constructor(connect) {
    solid(this, "connect", connect, false);
  }
  optValidator(val, fk, pk, key) {
    return key === "_id" ? ObjectId(val) : val;
  }
  optValidate(o) {
    return jet.map(o, this.optValidator.bind(this), true);
  }
  async getDB(context) {
    return (await this.connect(context)).db(context.model.namespace);
  }
  async getCollection(context) {
    return (await this.getDB(context)).collection(context.params.entity);
  }
  async remove(context) {
    const options = await context.fetchOptions();
    const { $filter } = this.optValidate({ $filter: options.$filter });
    const col = await this.getCollection(context);
    const res = await col.deleteOne($filter);
    return res.deletedCount;
  }
  async update(context) {
    const options = await context.fetchOptions();
    const { $filter } = this.optValidate({ $filter: options.$filter });
    const col = await this.getCollection(context);
    const res = await col.updateOne($filter, { $set: await context.pullRequestBody({}) });
    return res.matchedCount;
  }
  async insert(context) {
    const { primaryKey } = await context.fetchEntity();
    const body = await context.pullRequestBody({});
    if (primaryKey !== "_id" && !body[primaryKey]) {
      body[primaryKey] = jet.uid(16);
    }
    const col = await this.getCollection(context);
    const value = await col.insertOne(body);
    return col.findOne({ _id: value.insertedId });
  }
  async query(context) {
    const options = await context.fetchOptions();
    const { $select, $sort, $skip, $limit, $filter } = this.optValidate(options);
    const col = await this.getCollection(context);
    let qr = col.find($filter, { projection: $select || {} });
    if ($sort) {
      qr = qr.sort($sort);
    }
    if ($skip) {
      qr = qr.skip($skip);
    }
    if ($limit) {
      qr = qr.limit($limit);
    }
    return qr.toArray();
  }
  async count(context) {
    return (await this.query(context)).length;
  }
};
var Mongo_default = (connect) => new MongoAdapter(connect);
export {
  MongoAdapter,
  Mongo_default as default
};
//# sourceMappingURL=Mongo.js.map
