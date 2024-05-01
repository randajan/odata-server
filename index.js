import slib, { argv } from "@randajan/simple-lib";

import ImportGlobPlugin from 'esbuild-plugin-import-glob';


slib(argv.isBuild, {
    port:4002,
    mode:"node",
    minify:false,
    lib:{
        entries:["index.js", "mods/adapter/Mongo.js", "mods/responder/Express.js", "mods/responder/Koa.js"],
        plugins:[ImportGlobPlugin.default()]
    },
    demo:{
        external:["chalk"]
    }
})