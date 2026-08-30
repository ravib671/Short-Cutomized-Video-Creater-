export function normalizeCuts(value, sourceDuration) {
  let cuts = value;
  if (typeof cuts === 'string') {
    try { cuts = JSON.parse(cuts); } catch { return []; }
  }
  if (!Array.isArray(cuts)) return [];
  const duration = Math.max(0, Number(sourceDuration) || 0);
  const valid = cuts.map(cut => ({
    start: Math.max(0, Math.min(duration, Number(cut.start) || 0)),
    end: Math.max(0, Math.min(duration, Number(cut.end) || 0)),
  })).filter(cut => cut.end - cut.start >= .05).sort((a,b) => a.start - b.start);
  return valid.reduce((merged, cut) => {
    const previous = merged.at(-1);
    if (previous && cut.start <= previous.end) previous.end = Math.max(previous.end, cut.end);
    else merged.push(cut);
    return merged;
  }, []);
}

export const cutDuration = cuts => cuts.reduce((total, cut) => total + cut.end - cut.start, 0);

export function videoCutFilters(cuts) {
  if (!cuts.length) return [];
  const removed = cuts.map(cut => `between(t\\,${cut.start}\\,${cut.end})`).join('+');
  return [`select='not(${removed})'`, 'setpts=N/FRAME_RATE/TB'];
}

export function audioCutFilters(cuts) {
  if (!cuts.length) return [];
  const removed = cuts.map(cut => `between(t\\,${cut.start}\\,${cut.end})`).join('+');
  return [`aselect='not(${removed})'`, 'asetpts=N/SR/TB'];
}
