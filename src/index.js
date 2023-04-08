import { ODataServer } from "./class/ODataServer.js";
import { buildMetadata } from "./meta/metadata.js";
import { prune } from "./validations/prune.js";
import { queryTransform } from "./validations/queryTransform.js";

export default (options)=>new ODataServer(options);

export {
    queryTransform,
    buildMetadata,
    prune
}
