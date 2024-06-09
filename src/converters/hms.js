
const _tsPattern = /^(\d+:)?([0-5]?\d):([0-5]\d)$/;
const _tsList = [
  { unit: "H", factor: 3600000, patternIndex: 1 },
  { unit: "M", factor: 60000, patternIndex: 2 },
  { unit: "S", factor: 1000, patternIndex: 3 }
];

export const msToHms = (milliseconds) => {
  if (typeof milliseconds !== "number" || isNaN(milliseconds) || milliseconds < 0) { return; }

  let duration = '';

  for (const { factor } of _tsList) {
    const val = Math.floor(milliseconds / factor);
    milliseconds %= factor;
    duration += String(val).padStart(2, "0") + `:`;
  }

  return duration.slice(0, -1); // Odstranění posledního dvojtečky
}

export const hmsToMs = (hms) => {
  const m = String(hms).match(_tsPattern);
  if (!m?.length) { return; }

  let ms = 0;
  for (const { factor, patternIndex } of _tsList) {
    const value = parseInt(m[patternIndex], 10);
    if (!isNaN(value)) { ms += value * factor; }
  };

  return ms;
}