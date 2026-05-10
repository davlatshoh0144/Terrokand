========================================
  SILK ROAD SOARER - .EXE BUILD GUIDE
  Magic Carpet Adventure Game
========================================

This folder contains everything you need to build
your game as a standalone Windows .exe file.


HOW TO CREATE THE .EXE (Simple Steps):
--------------------------------------

1. Make sure you have Python installed:
   - Download from: https://www.python.org/downloads/
   - During installation, CHECK "Add Python to PATH"
   - Verify: open Command Prompt and type: python --version

2. Double-click "build.bat"
   - This will automatically:
     a) Install required Python packages
     b) Create the game launcher
     c) Build the .exe file
     d) Clean up temporary files

3. Wait 2-5 minutes for the build to complete

4. Your "Terrokand.exe" will appear in this folder!

5. Double-click Terrokand.exe to play!


MANUAL BUILD (if build.bat doesn't work):
-----------------------------------------
Open Command Prompt in this folder and run:

  pip install pywebview pyinstaller

Then run these commands one by one:

  pyinstaller --name="Terrokand" --onefile --windowed ^
      --add-data="game-dist;game-dist" ^
      --clean --noconfirm launcher.py

Your .exe will be in the "dist" folder.


TROUBLESHOOTING:
----------------

- "python not found": Python is not in PATH.
  Reinstall Python and check "Add Python to PATH"

- "pip not found": Same as above, reinstall Python

- Antivirus blocking: The .exe is safe but some antivirus
  may flag PyInstaller-built .exe. Add an exception.

- Large file size: This is normal. The .exe includes
  Python + WebView engine + all game files (~30-40 MB)


GAME CONTROLS:
--------------
- Mouse/Touch: Move up/down to control the carpet
- Keyboard: Arrow Keys or W/S to move, ESC/P to pause
- F11: Toggle fullscreen


========================================
Good luck at the Game Jam! 
========================================
