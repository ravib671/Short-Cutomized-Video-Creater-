# Short Video Creator

A responsive React/Vite editor with a modular Express + FFmpeg rendering service.

## Run locally

```bash
npm install
npm run dev
```

This starts both the Vite frontend at `http://localhost:5173` and the rendering API at
`http://localhost:3000`. Use `npm run dev:client` or `npm run dev:server` only when you
specifically need to run one side by itself.

The development launcher invokes Vite through Node directly, so the same command works
in PowerShell, Command Prompt, macOS, and Linux without requiring a shell-specific `npx`
executable.

Build the client and start the API (requires FFmpeg on `PATH`):

```bash
npm run build
npm start
```

Uploaded media is stored in `server/.tmp` only while rendering and removed after the download finishes or processing fails.

If an upload fails, check the server terminal for the complete error. The UI also reports
actionable messages for file-size limits, unexpected multipart fields, temporary disk-space
issues, and write-permission problems.

The server uses ES modules. Paths are resolved from `import.meta.url`, so no global
CommonJS `__dirname` value or current-working-directory assumption is required.

Render creation responses include explicit `statusUrl` and `downloadUrl` values. The
client uses these URLs directly instead of reconstructing dynamic API paths.

All eight templates are applied by FFmpeg to the exported pixels, not only to the browser
preview. Each preset has a distinct color treatment plus timed intro and outro fades.

When a soundtrack is uploaded, it replaces the video's original audio rather than being
mixed with it. The editor lets you preview it and choose its starting point; FFmpeg aligns
that point to the video start, then pads or trims the soundtrack to the selected video length.

The video editor can mark multiple start/end ranges for removal. Cuts remain editable until
Update video is selected, and the output-length control automatically uses the edited duration.

`npm run dev` first performs a syntax check on the server and launcher. If Git reports
merge conflicts while updating, resolve them before starting; do not concatenate two
versions of `server/index.js`, because that can leave route statements outside a function.
