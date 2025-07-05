import { info } from "@randajan/simple-lib/node";
import ODataServer from "../../dist/esm/index.mjs";
import mongoAdapter from "../../dist/esm/mods/adapter/Mongo.mjs";
import expressResponder from "../../dist/esm/mods/responder/Express.mjs";

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
            "name": {"type": "Edm.String"},            
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
    // converter:(primitive, value, method, context)=>{
    //     //console.log(primitive, value, method);
    //     console.log(primitive, method, context.test);
    //     return value;
    // },
    filter:async (context, collectionName, propertyName)=>{
        if (context.test === "test") { return false; }
        //if (propertyName === "test") { return false; }
        //return collectionName !== "users";
        return true;
    },
    extender: async (context, test)=>{

        //console.log(await context.fetchOptions());
        context.test = test;
    }
});

http.createServer(mongoApi.serve(expressResponder, 'http://localhost:1337/odata', "tesst")).listen(1337);