import { unwrap } from "./tools";

const _tsPattern = /^P([0-9]+D)?(T([0-9]+H)?([0-9]+M)?([0-9]+S)?)?$/;
const _tsList = [
    { unit: "D", factor: 86400000, group: "", patternIndex: 1 },
    { unit: "H", factor: 3600000, group: "T", patternIndex: 3 },
    { unit: "M", factor: 60000, group: "T", patternIndex: 4 },
    { unit: "S", factor: 1000, group: "T", patternIndex: 5 }
];

export const msToTimespan = (milliseconds, quoteLeft = "duration'", quoteRight = "'") => {
    let rest = milliseconds;
    let duration = "P";
    let groupCurrent = "";

    for (const { unit, factor, group } of _tsList) {
        const value = Math.floor(rest / factor);
        rest %= factor;
        if (value <= 0) { continue; }
        if (group !== groupCurrent) { duration += (groupCurrent = group); }
        duration += `${value}${unit}`;
    };

    return quoteLeft + duration + quoteRight;
};

export const timespanToMs = (timespan = "", quoteLeft = "duration'", quoteRight = "'") => {
    const m = unwrap(timespan, quoteLeft, quoteRight).match(_tsPattern);
    let ms = 0;

    if (m?.length) {
        for (const { factor, patternIndex } of _tsList) {
            const value = parseInt(m[patternIndex], 10);
            if (!isNaN(value)) { ms += value * factor; }
        };
    }

    return ms;
}


// const durationExamples = [
//   "duration'P2DT4H30M'",
//   "duration'PT10H15M'",
//   "duration'PT45M'",
//   "duration'P7DT2H'",
//   "duration'PT1H30M20S'",
//   "duration'P3D'",
//   "duration'PT2M'",
//   "duration'P1DT12H45M'",
//   "duration'PT5S'",
//   "duration'PT8H'",
//   "duration'P4DT6H10M'",
//   "duration'PT30M'",
//   "duration'PT1S'",
//   "duration'P2DT23H59M59S'",
//   "duration'PT20M'",
//   "duration'P1DT1H'",
//   "duration'PT15S'",
//   "duration'PT2H30M'",
//   "duration'P5D'",
//   "duration'PT10S'"
// ];

// console.log(durationExamples.map(e=>[e, timespanToMs(e), msToTimespan(timespanToMs(e)), msToTimespan(timespanToMs(e)) === e]));