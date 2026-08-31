const multerMessages = {
  LIMIT_FILE_SIZE: 'A selected file is larger than the 500 MB upload limit.',
  LIMIT_FILE_COUNT: 'Too many files were selected. Upload one video and one audio file.',
  LIMIT_UNEXPECTED_FILE: 'The upload contained an unexpected file field. Please select the video and music again.',
  LIMIT_FIELD_COUNT: 'The upload contained too many form fields.',
  LIMIT_FIELD_KEY: 'One of the upload field names is too long.',
  LIMIT_FIELD_VALUE: 'One of the customization values is too long.',
  LIMIT_PART_COUNT: 'The upload contains too many parts.',
};

export function uploadErrorMessage(error, isMulterError = false) {
  if (isMulterError) return multerMessages[error.code] || `Upload rejected: ${error.message}`;

  if (error?.code === 'ENOSPC') return 'The server does not have enough temporary disk space for this upload.';
  if (error?.code === 'EACCES' || error?.code === 'EPERM') {
    return 'The server cannot write uploaded files. Check permissions for server/.tmp.';
  }
  return error?.message ? `Upload failed: ${error.message}` : 'The upload could not be processed.';
}
