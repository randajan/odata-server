// src/adapter/MongoAdapter.js
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
    return (await this.connect(context)).db(context.server.model.namespace);
  }
  async getCollection(context) {
    return (await this.getDB(context)).collection(context.params.collection);
  }
  async remove(context) {
    const col = await this.getCollection(context);
    const { options } = context;
    const { $filter } = this.optValidate({ $filter: options.$filter });
    const res = await col.deleteOne($filter);
    if (res.deletedCount < 1) {
      throw { code: 410, msg: "Gone" };
    }
    return res.deletedCount;
  }
  async update(context) {
    const col = await this.getCollection(context);
    const { options, getBody } = context;
    const { $filter } = this.optValidate({ $filter: options.$filter });
    const res = await col.updateOne($filter, { $set: await getBody(true) });
    if (res.matchedCount < 1) {
      throw { code: 410, msg: "Gone" };
    }
    return res.matchedCount;
  }
  async insert(context) {
    const col = await this.getCollection(context);
    const { primaryKey } = context.entity;
    const body = await context.getBody(true);
    if (!body[primaryKey]) {
      body[primaryKey] = jet.uid(16);
    }
    const value = await col.insertOne(body);
    return col.findOne({ _id: value.insertedId });
  }
  async query(context) {
    const col = await this.getCollection(context);
    const { options } = context;
    const { $select, $sort, $skip, $limit, $count, $inlinecount, $filter } = this.optValidate(options);
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
    if ($count) {
      return qr.count();
    }
    const value = await qr.toArray();
    if (!$inlinecount) {
      return value;
    }
    const count = await col.find($filter).count();
    return { count, value };
  }
};
var MongoAdapter_default = (connect) => new MongoAdapter(connect);
export {
  MongoAdapter,
  MongoAdapter_default as default
};
//# sourceMappingURL=MongoAdapter.js.map
