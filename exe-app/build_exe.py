#!/usr/bin/env python3
"""
Terrokand - .EXE Builder
Run this on Windows to create a standalone .exe of the game
Usage: python build_exe.py
"""
import os
import sys
import shutil
import subprocess

GAME_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'game-dist')
BUILD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build-output')

def create_wrapper_script():
    """Create a Python wrapper that launches the game in a webview window"""
    wrapper = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'launcher.py')
    with open(wrapper, 'w') as f:
        f.write('''
import webview
import os
import sys

game_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'game-dist')
index_file = os.path.join(game_dir, 'index.html')

window = webview.create_window(
    'Terrokand',
    index_file,
    width=1280,
    height=720,
    min_size=(800, 600),
    text_select=False,
    confirm_close=True,
)

webview.start(debug=False)
''')
    return wrapper

def build_exe():
    print("=" * 60)
    print("  Terrokand - .EXE Builder")
    print("  Converting web game to standalone Windows executable")
    print("=" * 60)
    print()
    
    # Check if PyInstaller is available
    try:
        import PyInstaller
    except ImportError:
        print("Installing PyInstaller...")
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'pywebview', 'pyinstaller'])
    
    # Create wrapper script
    print("Creating game launcher...")
    wrapper = create_wrapper_script()
    
    # Clean previous builds
    if os.path.exists('build'):
        shutil.rmtree('build')
    if os.path.exists('dist'):
        shutil.rmtree('dist')
    
    # Build with PyInstaller
    print("Building .exe with PyInstaller (this may take a few minutes)...")
    print()
    
    cmd = [
        sys.executable, '-m', 'PyInstaller',
        '--name', 'Terrokand',
        '--onefile',
        '--windowed',
        '--add-data', f'{GAME_DIR};game-dist',
        '--clean',
        '--noconfirm',
        '--hidden-import', 'webview',
        '--hidden-import', 'webview.platforms.winforms',
        wrapper
    ]
    
    try:
        subprocess.check_call(cmd)
        
        exe_path = os.path.join('dist', 'Terrokand.exe')
        if os.path.exists(exe_path):
            file_size = os.path.getsize(exe_path) / (1024 * 1024)
            print()
            print("=" * 60)
            print(f"  SUCCESS! .EXE created!")
            print(f"  Location: {os.path.abspath(exe_path)}")
            print(f"  Size: {file_size:.1f} MB")
            print("=" * 60)
            print()
            print("  Your game is ready! Double-click Terrokand.exe to play.")
            print()
            return True
    except subprocess.CalledProcessError as e:
        print(f"Build failed: {e}")
        return False
    
    return False

if __name__ == '__main__':
    build_exe()
