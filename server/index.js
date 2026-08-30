import express from 'express';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { templates } from './templates.js';
import { uploadErrorMessage } from './upload-errors.js';

// ES modules do not provide CommonJS globals such as `__dirname`. Derive it
// from import.meta.url so Windows and Unix paths are both resolved correctly.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = __dirname;
const temp = path.join(root, '.tmp');
await fs.mkdir(temp, { recursive: true });
const upload = multer({ dest: temp, limits: { fileSize: 500 * 1024 * 1024 } });
const app = express();
const jobs = new Map();
app.use(express.static(path.join(root, '../dist')));
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.type('application/json');
  next();
});

const removeFiles = files => Promise.allSettled(files.filter(Boolean).map(file => fs.unlink(file)));

app.get('/api/health', (_req, res) => res.json({ status:'ok' }));

const probeDuration = input => new Promise((resolve, reject) => {
  ffmpeg.ffprobe(input, (error, metadata) => {
    if (error) reject(error);
    else resolve(Number(metadata.format?.duration) || 30);
  });
});

async function processJob(job, fields) {
  const styleName = templates[fields.style] ? fields.style : 'cinematic';
  const style = templates[styleName];
  const ratio = ['9:16','1:1','16:9'].includes(fields.ratio) ? fields.ratio : '9:16';
  const sizes = { '9:16':'1080:1920', '1:1':'1080:1080', '16:9':'1920:1080' };
  const sourceDuration = await probeDuration(job.video);
  const requestedDuration = Number(fields.duration) || sourceDuration;
  const duration = Math.max(1, Math.min(sourceDuration, requestedDuration, 30));
  const outroStart = Math.max(style.intro, duration - style.outro);
  const command = ffmpeg(job.video);
  if (job.audio) command.input(job.audio);
  command.videoFilters([
    `scale=${sizes[ratio]}:force_original_aspect_ratio=decrease`,
    `pad=${sizes[ratio]}:(ow-iw)/2:(oh-ih)/2`,
    style.filter,
    `fade=t=in:st=0:d=${style.intro}:color=${style.fadeColor}`,
    `fade=t=out:st=${outroStart}:d=${style.outro}:color=${style.fadeColor}`,
  ]).duration(duration)
    .outputOptions(['-c:v libx264','-preset fast','-movflags +faststart','-pix_fmt yuv420p']);
  if (job.audio) command.complexFilter(`[0:a]volume=${Number(fields.originalVolume)||.45}[a0];[1:a]volume=${Number(fields.musicVolume)||style.musicVolume}[a1];[a0][a1]amix=inputs=2:duration=shortest[a]`).outputOptions(['-map 0:v','-map [a]','-c:a aac']);

  command.on('start', () => Object.assign(job, {
    status:'processing',
    stage:`Applying ${styleName[0].toUpperCase() + styleName.slice(1)} style and mixing audio`,
  }));
  command.on('progress', ({ percent }) => { job.progress = Math.max(job.progress, Math.min(99, Math.round(percent || 0))); });
  command.on('end', async () => {
    Object.assign(job, { status:'complete', stage:'Ready to download', progress:100 });
    await removeFiles([job.video, job.audio]);
  });
  command.on('error', async error => {
    Object.assign(job, { status:'failed', error:error.message, stage:'Render failed' });
    await removeFiles([job.video, job.audio, job.output]);
  });
  command.save(job.output);
}

app.post('/api/render/jobs', upload.fields([{ name:'video', maxCount:1 }, { name:'audio', maxCount:1 }]), (req,res) => {
  const video = req.files?.video?.[0];
  if (!video) {
    removeFiles([req.files?.audio?.[0]?.path]);
    return res.status(400).json({ error:'A video file is required.' });
  }
  const id = crypto.randomUUID();
  const job = {
    id, video:video.path, audio:req.files?.audio?.[0]?.path,
    output:path.join(temp, `${id}.mp4`), status:'queued', stage:'Preparing your video', progress:0,
  };
  jobs.set(id, job);
  setTimeout(async () => {
    if (!jobs.has(id)) return;
    jobs.delete(id);
    await removeFiles([job.video, job.audio, job.output]);
  }, 60 * 60 * 1000).unref();
  res.status(202).json({
    jobId:id,
    statusUrl:`/api/render/status?id=${encodeURIComponent(id)}`,
    downloadUrl:`/api/render/download?id=${encodeURIComponent(id)}`,
  });
  processJob(job, req.body).catch(async error => {
    Object.assign(job, { status:'failed', error:error.message, stage:'Render failed' });
    await removeFiles([job.video, job.audio, job.output]);
  });
});

function sendJobStatus(id, res) {
  const job = jobs.get(id);
  if (!job) {
    res.status(404).json({ error:'Render job not found.' });
  } else {
    res.json({ status:job.status, stage:job.stage, progress:job.progress, error:job.error });
  }
}

app.get('/api/render/status', (req,res) => sendJobStatus(req.query.id, res));
app.get('/api/render/jobs/:id', (req,res) => sendJobStatus(req.params.id, res));

async function sendJobDownload(id, res) {
  const job = jobs.get(id);
  if (!job) {
    res.status(404).json({ error:'Render job not found.' });
    return;
  }
  if (job.status !== 'complete') {
    res.status(409).json({ error:'The video is not ready yet.' });
    return;
  }
  try {
    const { size } = await fs.stat(job.output);
    res.status(200);
    res.set({
      'Content-Type':'video/mp4',
      'Content-Length':String(size),
      'Content-Disposition':'attachment; filename="short-video.mp4"',
    });
    await pipeline(createReadStream(job.output), res);
  } finally {
    jobs.delete(job.id);
    await removeFiles([job.output]);
  }
}

const downloadJob = getJobId => async (req, res) => {
  try {
    await sendJobDownload(getJobId(req), res);
  } catch (error) {
    if (res.headersSent) res.destroy(error);
    else res.status(500).json({ error:`The finished MP4 could not be downloaded: ${error.message}` });
  }
};
app.get('/api/render/download', downloadJob(req => req.query.id));
app.get('/api/render/jobs/:id/download', downloadJob(req => req.params.id));

app.use('/api', (_, res) => res.status(404).json({ error:'API endpoint not found.' }));
app.use((error, _req, res, _next) => {
  const multerError = error instanceof multer.MulterError;
  const clientError = multerError && error.code?.startsWith('LIMIT_');
  console.error('Upload request failed:', error);
  res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : clientError ? 400 : 500).json({
    error: uploadErrorMessage(error, multerError),
    code: error.code || 'UPLOAD_FAILED',
  });
});
app.get(/.*/, (_,res) => res.sendFile(path.join(root, '../dist/index.html')));
app.listen(process.env.PORT || 3000, () => console.log(`Short Video Creator running on port ${process.env.PORT || 3000}`));
