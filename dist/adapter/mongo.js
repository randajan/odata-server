// src/adapter/mongo.js
import { ObjectId } from "mongodb";
import jet from "@randajan/jet-core";
var { solid, cached } = jet.prop;
var _convertStringsToObjectIds = (obj) => jet.map(obj, (val, fullKey, parentKey, key) => {
  return key === "_id" ? ObjectId(val) : val;
}, true);
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
var query = async (collection, { options }) => {
  const { $select, $sort, $skip, $limit, $count, $inlinecount, $filter } = _convertStringsToObjectIds(options);
  let qr = collection.find($filter, { projection: $select || {} });
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
  const count = await collection.find($filter).count();
  return { count, value };
};
var mongo_default = (getDB) => {
  const _actions = { update, remove, query, insert };
  return async (actionName, context) => {
    const action = _actions[actionName];
    if (!action) {
      throw Error(`Unknown action '${actionName}'`);
    }
    const db = await getDB();
    const collection = db.collection(context.params.collection);
    return action(collection, context);
  };
};
export {
  mongo_default as default
};
//# sourceMappingURL=mongo.js.map
