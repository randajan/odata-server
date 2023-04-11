import { log } from "@randajan/simple-lib/node";
import ODataServer from "../../dist/index.js";
import mongoAdapter from "../../dist/adapter/MongoAdapter.js";

import { MongoClient } from "mongodb";
import http from "http";

const _mongos = {};
const _protocolSuffix = /:\/\//;


const getMongo = async context=>{
    let dbUrl = "localhost:27017";

    if (!_protocolSuffix.test(dbUrl)) { dbUrl = "mongodb://" + dbUrl; }

    let mongo = _mongos[dbUrl]
    if (!mongo) { 
        mongo = _mongos[dbUrl] = await MongoClient.connect(dbUrl);
        process.on("exit", _=>mongo.close());
        mongo.on("close", _=>{ delete _mongos[dbUrl]; });
    }

    return mongo;
}

const model = {
    namespace: "piapmo",
    entityTypes: {
        "UserType": {
            "_id": {"type": "Edm.String", key: true},
            "test": {"type": "Edm.String"}
        },
        "DebugRequestType":{
            "_id": {"type": "Edm.String", key:true},
            "at": {"type": "Edm.TimeOfDay"},
            "method": {"type": "Edm.String"},
            "path": {"type": "Edm.String"},
            "query": {"type": "Edm.String"},
            "headers": {"type": "Edm.String"},
            "body": {"type": "Edm.String"}
        },
        "BestType":{
            "lol": {"type":"Edm.String", key:true},
            "brutal": { "type":"Edm.String" }
        }
    },   
    entitySets: {
        "users": {
            entityType: "piapmo.UserType"
        },
        "_debug_requests":{
            entityType: "piapmo.DebugRequestType"
        },
        "bests":{
            entityType:"piapmo.BestType"
        }
    }
};

export const mongoApi = ODataServer({
    url:'http://localhost:1337',
    model,
    adapter:mongoAdapter(getMongo),
    converter:(primitive, value, method)=>{
        console.log(primitive, value, method);
        return value;
    }
});


http.createServer(mongoApi.resolver).listen(1337);