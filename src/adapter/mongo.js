import { MongoClient, ObjectId } from "mongodb";
import jet from "@randajan/jet-core";

const { solid, cached } = jet.prop;

const _methodsArgs = {
    update: ["collectionName", "query", "data", "request", "callback"],
    remove: ["collectionName", "query", "request", "callback"],
    insert: ["collectionName", "data", "request", "callback"],
    query: ["collectionName", "query", "request", "callback"]
};

const _fetchContext = (methodName, args) => {
    const context = solid.all({}, { methodName });
    const methodArgs = _methodsArgs[methodName];

    for (let k in methodArgs) {
        const arg = args[k];
        const argName = methodArgs[k];
        const enumerable = (argName !== "request" && argName !== "callback");
        solid(context, argName, arg, enumerable);
    }

    return context;
}

const _hexTest = /^[0-9A-Fa-f]{24}$/;
const _convertStringsToObjectIds = o => {
    if (!Object.jet.is(o)) { return o; }

    for (var i in o) {
        if (i === '_id' && String.jet.is(o[i]) && _hexTest.test(o[i])) { o[i] = new ObjectId(o[i]); }
        else { o[i] = _convertStringsToObjectIds(o[i]); }
    }

    return o;
};

const update = async (collection, { query, data }) => {
    if (data.$set) { delete data.$set._id; } //idk why, it was in source code

    const res = await collection.updateOne(query, data);

    if (res.matchedCount !== 1) { throw Error('Update not successful'); }

    return res.matchedCount;
}

const remove = async (collection, { query }) => {

    const res = await collection.deleteOne(query);

    if (res.deletedCount !== 1) { throw Error('Remove not successful'); }

    return res.deletedCount;

}

const insert = async (collection, { data }) => {

    const value = await collection.insertOne(data);

    return collection.findOne({ _id: value.insertedId });

}

const query = async (collection, { query }) => {

    let qr = collection.find(query.$filter, { projection: query.$select || {} });

    if (query.$sort) { qr = qr.sort(query.$sort); }
    if (query.$skip) { qr = qr.skip(query.$skip); }
    if (query.$limit) { qr = qr.limit(query.$limit); }
    if (query.$count) { return qr.count(); }

    const value = await qr.toArray();

    if (!query.$inlinecount) { return value; }

    const count = await collection.find(query.$filter).count();

    return { count, value };

}

const _methods = { update, remove, query, insert };

export default getDB=>{
    
    return async (methodName, req)=>{
        const method = _methods[methodName];
        if (!method) { throw Error(`Unknown method '${methodName}'`); }

        //const { collectionName, query, data, callback } = context;
        const db = await getDB();
        //const collection = db.collection(collectionName);
    
        //_convertStringsToObjectIds(query);
        //_convertStringsToObjectIds(data);
    
        //return method(collection, req);
    }

}
