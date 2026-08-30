import express from 'express';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { templates } from './templates.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const temp = path.join(root, '.tmp');
await fs.mkdir(temp, { recursive: true });
const upload = multer({ dest: temp, limits: { fileSize: 500 * 1024 * 1024 } });
const app = express();
app.use(express.static(path.join(root, '../dist')));

app.post('/api/render', upload.fields([{ name:'video', maxCount:1 }, { name:'audio', maxCount:1 }]), async (req,res) => {
  const files = Object.values(req.files || {}).flat();
  const video = req.files?.video?.[0];
  const audio = req.files?.audio?.[0];
  if (!video) return res.status(400).json({ error:'A video file is required.' });
  const style = templates[req.body.style] || templates.cinematic;
  const ratio = ['9:16','1:1','16:9'].includes(req.body.ratio) ? req.body.ratio : '9:16';
  const sizes = { '9:16':'1080:1920', '1:1':'1080:1080', '16:9':'1920:1080' };
  const output = path.join(temp, `${crypto.randomUUID()}.mp4`);
  try {
    const command = ffmpeg(video.path);
    if (audio) command.input(audio.path);
    const filters = [`scale=${sizes[ratio]}:force_original_aspect_ratio=decrease`, `pad=${sizes[ratio]}:(ow-iw)/2:(oh-ih)/2`, style.filter];
    command.videoFilters(filters).duration(Number(req.body.duration) || 30).outputOptions(['-c:v libx264','-preset fast','-movflags +faststart','-pix_fmt yuv420p']);
    if (audio) command.complexFilter(`[0:a]volume=${Number(req.body.originalVolume)||.45}[a0];[1:a]volume=${Number(req.body.musicVolume)||style.musicVolume}[a1];[a0][a1]amix=inputs=2:duration=shortest[a]`).outputOptions(['-map 0:v','-map [a]','-c:a aac']);
    await new Promise((resolve,reject)=>command.on('end',resolve).on('error',reject).save(output));
    res.download(output, 'short-video.mp4', async () => { await Promise.allSettled([...files.map(f=>fs.unlink(f.path)),fs.unlink(output)]); });
  } catch (error) {
    await Promise.allSettled([...files.map(f=>fs.unlink(f.path)),fs.unlink(output)]);
    res.status(500).json({ error:'Video processing failed.', detail:error.message });
  }
});

app.get('*', (_,res) => res.sendFile(path.join(root, '../dist/index.html')));
app.listen(process.env.PORT || 3000, () => console.log(`Short Video Creator running on port ${process.env.PORT || 3000}`));
