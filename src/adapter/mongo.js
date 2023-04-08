import { ObjectId } from "mongodb";
import jet from "@randajan/jet-core";

const { solid, cached } = jet.prop;

const _convertStringsToObjectIds = obj => jet.map(obj, (val, fullKey, parentKey, key)=>{
    return (key === '_id') ? ObjectId(val) : val;
}, true)


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

const query = async (collection, { options }) => {
    const { $select, $sort, $skip, $limit, $count, $inlinecount, $filter } = _convertStringsToObjectIds(options);

    let qr = collection.find($filter, { projection: $select || {} });

    if ($sort) { qr = qr.sort($sort); }
    if ($skip) { qr = qr.skip($skip); }
    if ($limit) { qr = qr.limit($limit); }
    if ($count) { return qr.count(); }

    const value = await qr.toArray();

    if (!$inlinecount) { return value; }

    const count = await collection.find($filter).count();

    return { count, value };

}

export default getDB=>{
    const _actions = { update, remove, query, insert };
    
    return async (actionName, context)=>{
        const action = _actions[actionName];
        if (!action) { throw Error(`Unknown action '${actionName}'`); }
        
        const db = await getDB();
        const collection = db.collection(context.params.collection);
    
        return action(collection, context);
    }

}
