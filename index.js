import sapp from "@randajan/simple-lib";


sapp(false, {
    port:4002,
    mode:"node",
    external:["@randajan/jet-core", "safe-buffer", "path-to-regexp", "http", "methods"]
})