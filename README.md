# Terrokand

`Terrokand` is a game project by team **Arcanoids**, prepared for GameFest / GameJam Uzbekistan.

The project includes:
- a browser-based game app (`app`)
- an Electron desktop wrapper and Windows packaging setup (`exe-app`)

## Team

- Team name: **Arcanoids**
- App name: **Terrokand**

-Contributers 
  -Diyorbek Zokirov =  mini game developer                         ==claude/gemini
  -Abdulaziz Abdukhafizov =  game level constructor/logic design   ==kimi
  -Mironshoh Ahmadaov = Video Editer/sleeper                       == copilot
  -Davlatshoh Hoshimov = GUI Polish/debug                          == chatgpt/codex
  -Mustafo Xalimov = Sound Designer                                ==suno

## Tech Stack and Engine

The gameplay runs on a custom **2D HTML5 Canvas game engine** written in **TypeScript**.
The frontend shell is built with **React + Vite**.

For desktop distribution:
- **Electron** is used to run the web build as a desktop app
- **electron-builder** is used to package the app into a Windows `.exe`

## How the `.exe` Build Is Produced

1. Build the web game with Vite.
2. Copy the built files into `exe-app/game-dist`.
3. Package the desktop app with Electron Builder.

In this project, the packaged build command is:

```bash
cd exe-app
npm run build-current-portable
```

This runs:
- `sync-game-dist` (builds and syncs game assets)
- `electron-builder --win portable --x64`

## How to Launch the Game

### Option 1: Run from source (development)

```bash
cd app
npm install
npm run dev
```

Then open:
- `http://127.0.0.1:3001/` (or the port shown by Vite)

### Option 2: Build and run as Windows app (`.exe`)

```bash
cd exe-app
npm install
npm run build-current-portable
```

After build, run:
- `exe-app/dist-exe/Terrokand-Portable-1.0.0.exe`

## Controls (Flying Carpet Mode)

- Mouse / touch: steer the carpet
- Keyboard: `W`, `A`, `S`, `D` for movement
- `Esc`: pause

## Credits and Sources

Project support and tooling contributions:
- **Kimi K2.6 agent**: idea generation, image generation
- **Gemini**: GUI support, image generation
- **Claude**: engineering tasks
- **Codex**: final debugging and polishing

Detailed attribution is also available in [SOURCES.md](./SOURCES.md).


(C) Copyright Reserved by ArcanoidsTM  
