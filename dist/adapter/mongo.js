// src/adapter/mongo.js
import { MongoClient, ObjectId } from "mongodb";
import jet from "@randajan/jet-core";
var { solid, cached } = jet.prop;
var update = async (collection, { query: query2, data }) => {
  if (data.$set) {
    delete data.$set._id;
  }
  const res = await collection.updateOne(query2, data);
  if (res.matchedCount !== 1) {
    throw Error("Update not successful");
  }
  return res.matchedCount;
};
var remove = async (collection, { query: query2 }) => {
  const res = await collection.deleteOne(query2);
  if (res.deletedCount !== 1) {
    throw Error("Remove not successful");
  }
  return res.deletedCount;
};
var insert = async (collection, { data }) => {
  const value = await collection.insertOne(data);
  return collection.findOne({ _id: value.insertedId });
};
var query = async (collection, { query: query2 }) => {
  let qr = collection.find(query2.$filter, { projection: query2.$select || {} });
  if (query2.$sort) {
    qr = qr.sort(query2.$sort);
  }
  if (query2.$skip) {
    qr = qr.skip(query2.$skip);
  }
  if (query2.$limit) {
    qr = qr.limit(query2.$limit);
  }
  if (query2.$count) {
    return qr.count();
  }
  const value = await qr.toArray();
  if (!query2.$inlinecount) {
    return value;
  }
  const count = await collection.find(query2.$filter).count();
  return { count, value };
};
var _methods = { update, remove, query, insert };
var mongo_default = (getDB) => {
  return async (methodName, req) => {
    const method = _methods[methodName];
    if (!method) {
      throw Error(`Unknown method '${methodName}'`);
    }
    const db = await getDB();
  };
};
export {
  mongo_default as default
};
//# sourceMappingURL=mongo.js.map
