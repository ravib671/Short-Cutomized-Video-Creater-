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
