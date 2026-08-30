import test from 'node:test';
import assert from 'node:assert/strict';
import { getResponseError, getResponseJson } from './api.js';

test('returns a JSON API error', async () => {
  const response = new Response(JSON.stringify({ error: 'FFmpeg failed.' }), {
    status: 500,
    headers: { 'content-type': 'application/json' },
  });
  assert.equal(await getResponseError(response), 'FFmpeg failed.');
});

test('handles an empty error response without parsing JSON', async () => {
  const response = new Response('', { status: 502 });
  assert.equal(await getResponseError(response), 'Video generation failed (502).');
});

test('passes through a plain-text proxy error', async () => {
  const response = new Response('Backend unavailable', {
    status: 503,
    headers: { 'content-type': 'text/plain' },
  });
  assert.equal(await getResponseError(response), 'Backend unavailable');
});

test('reports an empty successful response without leaking a JSON parse error', async () => {
  await assert.rejects(
    getResponseJson(new Response('', { status: 200 }), 'The render status API'),
    /render status API returned an empty response/,
  );
});

test('parses a valid render status response', async () => {
  const response = new Response(JSON.stringify({ status: 'processing', progress: 42 }));
  assert.deepEqual(await getResponseJson(response), { status: 'processing', progress: 42 });
});

test('identifies an HTML response caused by a disconnected API proxy', async () => {
  const response = new Response('<!doctype html><title>Short Video Creator</title>', {
    status: 200,
    headers: { 'content-type': 'text/html' },
  });
  await assert.rejects(getResponseJson(response, 'The render status API'), /API proxy reconnects/);
});
