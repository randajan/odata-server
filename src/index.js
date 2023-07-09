import { Server } from "./class/Server.js";
import { msToTimespan, timespanToMs } from "./converters.js";

export default (options)=>new Server(options);

export {
    Server,
    timespanToMs,
    msToTimespan
}
