
# Node odata-server
[![NPM Version](http://img.shields.io/npm/v/@randajan/odata-server.svg?style=flat-square)](https://npmjs.com/package/@randajan/odata-server)
[![License](http://img.shields.io/npm/l/@randajan/odata-server.svg?style=flat-square)](http://opensource.org/licenses/MIT)

**Simple implementation of OData server running on Node.js with easy adapters for mongodb** Just define an OData model, provide a mongo, hook into node.js http server and run. 

It supports basic operations you would expect like providing $metadata, filtering and also operations for insert, update and delete. On the other hand it suppose to be really simple so you don't get support for entity links, batch operations, atom feeds and many others. 

## Get started

This is how you can create an OData server with node.js http module and mongodb.
```js
import ODataServer from "@randajan/odata-server";
import mongoAdapter from "@randajan/odata-server/mongoAdapter";

import { MongoClient } from "mongodb";
import http from "http";

const mongo = {
    url:"mongodb://localhost:27017",
}

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

const config = {
    url:'http://localhost:1337',
    cors:"*",
    model:{
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
    },
    adapter:mongoAdapter(getMongo),                             //Object.keys(adapter) == [ "query", "count", "insert", "update", "remove" ];
    converter:(primitive, value, method)=>{                     //custom 'value to type' convertor, method is enum = [ "toAdapter", "toResponse" ];
        console.log(primitive, value, method);
        return value;
    }
}

const server = ODataServer(config);

http.createServer(server.resolver).listen(1337);

```

Now you can try requests like:<br/>
GET [http://localhost:1337/$metadata]()<br/>
GET [http://localhost:1337/users?$filter=test eq 'a' or test eq 'b'&$skip=1&$take=5]()<br/>
GET [http://localhost:1337/users('aaaa')]()<br/>
GET [http://localhost:1337/users?$orderby=test desc]()<br/>
GET [http://localhost:1337/users/$count]()<br/>
POST, PATCH, DELETE

## express.js
It works well also with the express.js.
You even don't need to provide url in the `config` because it is also could be taken from the express.js request.

```js
app.use("/odata", server.resolver);
```
## config property

### config.url
root url, if it's not provided it will try to get it from the request once `server.resolve(req, res)` is called

### config.adapter
There is currently single adapter implemented. 
- [mongodb](https://www.mongodb.com/) - @randajan/odata-server/mongo

You can create your own adapter. It accepts any kind of object and it will look for certain properties:
- get
- count
- insert
- update
- remove

### config.cors
You can quickly set up cors without using express and middlewares using this property

### config.converter
You can define your custom type converter. It will be called everytime property tries to convert value to primitive type.
List of primitive types:
- Edm.Int16
- Edm.Int32
- Edm.Int64
- Edm.Boolean
- Edm.String
- Edm.Date
- Edm.Single
- Edm.Double
- Edm.Decimal
- Edm.TimeOfDay
- Edm.DateTimeOffset
- Edm.Byte
- Edm.SByte3
- Edm.Binary

There is two possible ways to create custom converter:
1. As function: `const converter = (primitive, value, method)=>{ ... }`
2. As object: `const converter = { [primitive]:(value, method)=>{ ... } }`

Argument `method` represent the direction of conversion and it could be one of:
1. "toAdapter": it represent the value coming from the request
2. "toResponse": it represent value coming from the adapter

## Limitations
- no entity links
- no batch operations
- no validations
- ... this would be a very long list, so rather check yourself

## Credits

The initial version of this project was created by [pofider](https://github.com/pofider) and can be found at [https://github.com/pofider/node-simple-odata-server](https://github.com/pofider/node-simple-odata-server).

## License
See [license](https://github.com/randajan/odata-server/blob/main/LICENSE)

