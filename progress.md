Original prompt: ok make these changes and make sure the exe file changed to and gudge again

## Notes
- Starting from packaged Terrokand build in `exe-app`.
- Emergency pass focuses on crash fixes, faster first-play UX, visible controls, package-safe assets/audio, rebuild, and judging from the EXE.
- Fixed carpet engine `levelConfig` initialization so the always-mounted canvas cannot crash before a level starts.
- Replaced the five-step first-flight onboarding with a single quick-start card.
- Added visible Back/Help/Pause labels and made fresh Start Flying go directly to carpet level select.
- `npm run build` now passes after removing an unused Registan restart callback that blocked `tsc`.
- Rebuilt `exe-app/dist-exe/Terrokand-Portable-1.0.0.exe`.
- Packaged EXE smoke test passed: fresh title, Start Flying, level select, onboarding, gameplay canvas, and Registan all render with no missing images or significant console errors.
- Changed carpet background rendering to cover the canvas instead of repeating non-tileable art, removing the visible vertical seam.
- New request: flying carpet background should scroll slowly with player progress using connected copies, and main menu needs a Quit Game button.
- Implemented distance-driven background strip rendering and Electron-backed Quit Game menu action.
- Fixed a quick-click race where selecting Level 1 before the carpet engine finished loading could show gameplay UI without starting distance progression.
- Rebuilt `exe-app/dist-exe/Terrokand-Portable-1.0.0.exe` with the latest carpet background and Quit Game changes.
- Packaged EXE verification passed: title shows `Quit Game`; Level 1 starts after onboarding; distance advanced from 26m to 208m during the smoke test; sampled canvas pixels changed, confirming the background scrolls; Quit Game exits the process.
