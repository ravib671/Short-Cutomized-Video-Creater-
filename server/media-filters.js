export function normalizedVolume(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : fallback;
}

export function replacementAudioFilter(duration, volume, startAt = 0) {
  return [
    `[1:a:0]atrim=start=${Math.max(0, Number(startAt) || 0)}`,
    'asetpts=PTS-STARTPTS',
    `volume=${volume}`,
    `apad=pad_dur=${duration}`,
    `atrim=duration=${duration}[soundtrack]`,
  ].join(',');
}
