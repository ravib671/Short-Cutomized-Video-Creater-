import test from 'node:test';
import assert from 'node:assert/strict';
import { animationFilters } from '../server/animations.js';

test('builds slow zoom at the selected output resolution', () => {
  const filters = animationFilters('slow-zoom', '1080:1920', 10);
  assert.equal(filters[0], 'fps=30');
  assert.match(filters[1], /zoompan=.*s=1080x1920/);
});

test('builds a duration-aware moving frame pan', () => {
  const filters = animationFilters('pan', '1920:1080', 12);
  assert.match(filters[0], /scale=/);
  assert.match(filters[1], /crop=1920:1080:.*t\/12/);
});

test('unknown animations safely leave frames unchanged', () => {
  assert.deepEqual(animationFilters('unknown', '1080:1920', 10), []);
});
