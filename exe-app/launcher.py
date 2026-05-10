
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
