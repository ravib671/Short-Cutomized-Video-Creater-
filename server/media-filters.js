export function normalizedVolume(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : fallback;
}

export function replacementAudioFilter(duration, volume) {
  return [
    '[1:a:0]silenceremove=start_periods=1:start_duration=0.1:start_threshold=-45dB',
    'asetpts=PTS-STARTPTS',
    `volume=${volume}`,
    `apad=pad_dur=${duration}`,
    `atrim=duration=${duration}[soundtrack]`,
  ].join(',');
}
