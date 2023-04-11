import slib from "@randajan/simple-lib";

import ImportGlobPlugin from 'esbuild-plugin-import-glob';


slib(false, {
    port:4002,
    mode:"node",
    lib:{
        entries:["index.js", "adapter/MongoAdapter.js"],
        plugins:[ImportGlobPlugin.default()]
    },
    demo:{
        external:["chalk"]
    }
    
})