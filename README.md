# Short Video Creator

A responsive React/Vite editor with a modular Express + FFmpeg rendering service.

## Run locally

```bash
npm install
npm run dev
```

Build the client and start the API (requires FFmpeg on `PATH`):

```bash
npm run build
npm start
```

Uploaded media is stored in `server/.tmp` only while rendering and removed after the download finishes or processing fails.
