import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizedVolume, replacementAudioFilter } from '../server/media-filters.js';

test('replacement soundtrack removes leading silence and resets its timestamp', () => {
  const filter = replacementAudioFilter(18, 0.72);
  assert.match(filter, /^\[1:a:0\]silenceremove=/);
  assert.match(filter, /asetpts=PTS-STARTPTS/);
  assert.match(filter, /apad=pad_dur=18,atrim=duration=18\[soundtrack\]$/);
  assert.doesNotMatch(filter, /\[0:a/);
});

test('volume normalization permits mute and clamps invalid ranges', () => {
  assert.equal(normalizedVolume('0', 0.5), 0);
  assert.equal(normalizedVolume('2', 0.5), 1);
  assert.equal(normalizedVolume('-1', 0.5), 0);
  assert.equal(normalizedVolume('invalid', 0.5), 0.5);
});
