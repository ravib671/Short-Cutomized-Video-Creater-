import test from 'node:test';
import assert from 'node:assert/strict';
import { uploadErrorMessage } from '../server/upload-errors.js';

test('explains an unexpected multipart field', () => {
  assert.match(
    uploadErrorMessage({ code: 'LIMIT_UNEXPECTED_FILE', message: 'Unexpected field' }, true),
    /unexpected file field/i,
  );
});

test('explains temporary directory permission failures', () => {
  assert.match(uploadErrorMessage({ code: 'EACCES' }), /permissions for server\/.tmp/i);
});

test('retains useful details for unknown upload errors', () => {
  assert.equal(uploadErrorMessage(new Error('connection closed')), 'Upload failed: connection closed');
});
