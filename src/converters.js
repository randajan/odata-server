


const _timespanPattern = /PT(\d+)H(\d+)M(\d+)S/;
export const msToTimespan = milliseconds => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `PT${hours}H${minutes}M${seconds}S`;
};

export const timespanToMs = timespan => {
    const matches = String(timespan).match(_timespanPattern);
  
    if (!matches || matches.length !== 4) { return 0; }
  
    const hours = parseInt(matches[1], 10);
    const minutes = parseInt(matches[2], 10);
    const seconds = parseInt(matches[3], 10);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  
    return totalSeconds * 1000;
};