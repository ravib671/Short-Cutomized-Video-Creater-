export async function getResponseError(response) {
  const fallback = `Video generation failed (${response.status || 'network error'}).`;
  const body = await response.text();
  if (!body.trim()) return fallback;
  try {
    const payload = JSON.parse(body);
    return payload.error || payload.detail || fallback;
  } catch {
    return response.headers.get('content-type')?.includes('text/plain') ? body : fallback;
  }
}

export async function getResponseJson(response, context = 'The server') {
  const body = await response.text();
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    if (!body.trim()) throw new Error(`${context} returned an empty response (${response.status}).`);
    try {
      const payload = JSON.parse(body);
      throw new Error(payload.error || payload.detail || `${context} returned an error (${response.status}).`);
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error(`${context} returned an invalid response (${response.status}).`);
      throw error;
    }
  }
  if (!body.trim()) throw new Error(`${context} returned an empty response. Make sure the API server is running.`);
  try {
    return JSON.parse(body);
  } catch {
    const receivedHtml = contentType.includes('text/html') || /^\s*</.test(body);
    throw new Error(receivedHtml
      ? `${context} returned the web app instead of API data. Restart npm run dev so the API proxy reconnects.`
      : `${context} returned an invalid response. Make sure the API server is running.`);
  }
}

function uploadJob(formData, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', '/api/render/jobs');
    request.upload.onprogress = ({ loaded, total, lengthComputable }) => {
      if (lengthComputable) onProgress(Math.round((loaded / total) * 40), 'Uploading files');
    };
    request.onerror = () => reject(new Error('The server could not be reached.'));
    request.onload = async () => {
      try {
        const response = new Response(request.responseText, {
          status: request.status,
          headers: { 'content-type': request.getResponseHeader('content-type') || '' },
        });
        resolve(await getResponseJson(response, 'The upload API'));
      } catch (error) {
        reject(error);
      }
    };
    request.send(formData);
  });
}

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

export async function renderVideo(formData, onProgress = () => {}) {
  const job = await uploadJob(formData, onProgress);
  const { jobId } = job;
  if (!jobId) throw new Error('The upload API did not return a render job ID.');
  const statusUrl = job.statusUrl || `/api/render/status?id=${encodeURIComponent(jobId)}`;
  const downloadUrl = job.downloadUrl || `/api/render/download?id=${encodeURIComponent(jobId)}`;
  onProgress(40, 'Preparing your video');

  while (true) {
    const statusResponse = await fetch(statusUrl, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    const job = await getResponseJson(statusResponse, 'The render status API');
    onProgress(40 + Math.round(job.progress * 0.6), job.stage || 'Rendering video');
    if (job.status === 'failed') throw new Error(job.error || 'Video processing failed.');
    if (job.status === 'complete') break;
    await wait(750);
  }

  const download = await fetch(downloadUrl);
  if (!download.ok) throw new Error(await getResponseError(download));
  onProgress(100, 'Download ready');
  return download.blob();
}
