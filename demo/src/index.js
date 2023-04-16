import { info } from "@randajan/simple-lib/node";
import ODataServer from "../../dist/index.js";
import mongoAdapter from "../../dist/adapter/MongoAdapter.js";

import { MongoClient } from "mongodb";
import http from "http";


const mongo = {
    url:"mongodb://localhost:27017",
}

const model = {
    namespace: "main",
    entityTypes: {
        "UserType": {
            "_id": {"type": "Edm.String", key: true},
            "test": {"type": "Edm.String"},            
        }
    },   
    entitySets: {
        "users": {
            entityType: "main.UserType"
        }
    }
};

const getMongo = async context=>{

    if (!mongo.current) { 
        mongo.current = await MongoClient.connect(mongo.url);
        mongo.current.on("close", _=>{ delete mongo.current; });
        process.on("exit", _=>{
            if (mongo.current) { mongo.current.close(); }
        });
    }
    
    return mongo.current;
}

const mongoApi = ODataServer({
    model,
    cors:"*",
    adapter:mongoAdapter(getMongo),
    converter:(primitive, value, method)=>{
        //console.log(primitive, value, method);
        return value;
    },
    filter:async (context, collectionName, propertyName)=>{
        if (context.test === "test") { return false; }
        //if (propertyName === "test") { return false; }
        //return collectionName !== "users";
        return true;
    },
    extender: async (context, test)=>{
        context.test = test;
        console.log(await context.fetchRequestBodyRaw());
    }
});


http.createServer(mongoApi.serve('http://localhost:1337/odata', "tsest")).listen(1337);