import * as files from "./resolvers/**";

const _prefix = "./resolvers/";
const _suffix = ".js";

export const methods = {};
export default methods;

files.filenames.forEach((pathname, index)=>{
    const name = pathname.substring(_prefix.length).slice(0, -_suffix.length);
    methods[name] = files.default[index].default;
});