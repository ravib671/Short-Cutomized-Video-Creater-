import test from 'node:test';
import assert from 'node:assert/strict';
import { cutDuration, normalizeCuts, videoCutFilters } from '../server/video-cuts.js';

test('normalizes, clamps, and merges overlapping video cuts', () => {
  const cuts = normalizeCuts([{start:8,end:14},{start:2,end:5},{start:4,end:9}], 12);
  assert.deepEqual(cuts, [{start:2,end:12}]);
  assert.equal(cutDuration(cuts), 10);
});

test('builds a select filter that stitches multiple kept sections', () => {
  const filters = videoCutFilters([{start:1,end:2},{start:4,end:5}]);
  assert.match(filters[0], /select='not\(between/);
  assert.equal(filters[1], 'setpts=N/FRAME_RATE/TB');
});
