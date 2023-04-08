import ODataServer from "../../dist/index.js";
import mongoAdapter from "../../dist/adapter/mongo.js";

import { MongoClient } from "mongodb";
import http from "http";

const _mongos = {};
const _protocolSuffix = /:\/\//;


const getMongo = async (dbUrl, options)=>{
    dbUrl = dbUrl || "localhost:27017";

    if (!_protocolSuffix.test(dbUrl)) { dbUrl = "mongodb://" + dbUrl; }

    if (_mongos[dbUrl]) { return _mongos[dbUrl]; }
    const mongo = _mongos[dbUrl] = await MongoClient.connect(dbUrl, options);
    mongo.on("close", _=>{ delete _mongos[dbUrl]; });

    return mongo;
}

const model = {
    namespace: "piapmo",
    entityTypes: {
        "UserType": {
            "_id": {"type": "Edm.String", key: true},
            "test": {"type": "Edm.String"},            
        },
        "DebugRequestType":{
            "at": {"type": "Edm.DateTime"},
            "method": {"type": "Edm.String"},
            "path": {"type": "Edm.String"},
            "query": {"type": "Edm.String"},
            "headers": {"type": "Edm.String"},
            "body": {"type": "Edm.String"}
        }
    },   
    entitySets: {
        "users": {
            entityType: "piapmo.UserType"
        },
        "_debug_requests":{
            entityType: "piapmo.DebugRequestType"
        }
    }
};

export const mongoApi = ODataServer({
    url:'http://localhost:1337',
    model,
    resolver:mongoAdapter(async _=>(await getMongo()).db("piapmo")),
});


http.createServer(mongoApi.getHandler()).listen(1337);