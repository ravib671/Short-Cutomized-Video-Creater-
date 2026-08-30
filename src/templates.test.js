import test from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../server/templates.js';

test('provides eight visually distinct render templates', () => {
  assert.equal(Object.keys(templates).length, 8);
  assert.equal(new Set(Object.values(templates).map(template => template.filter)).size, 8);
});

test('every template includes visible filters and timed intro/outro effects', () => {
  for (const [name, template] of Object.entries(templates)) {
    assert.match(template.filter, /eq=|curves=/, `${name} needs a color filter`);
    assert.ok(template.intro > 0, `${name} needs an intro`);
    assert.ok(template.outro > 0, `${name} needs an outro`);
    assert.ok(template.fadeColor, `${name} needs a fade color`);
  }
});
