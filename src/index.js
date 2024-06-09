import { Server } from "./class/Server.js";
import { msToHms, hmsToMs } from "./converters/hms.js";
import { msToTimespan, timespanToMs } from "./converters/timespan.js";

export default (options)=>new Server(options);

export {
    Server,
    timespanToMs,
    msToTimespan,
    msToHms,
    hmsToMs
}
