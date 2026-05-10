from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 720})
    page.goto('http://localhost:3000')
    time.sleep(2)
    page.click('text=Start Journey')
    time.sleep(1)
    page.click('text=Skip')
    time.sleep(8)
    
    # Find caravan elements
    els = page.query_selector_all('div[style*="caravanWalk"]')
    print('Found', len(els), 'caravan container elements')
    for i, el in enumerate(els):
        box = el.bounding_box()
        print(f'  [{i}] x={box["x"]:.0f} y={box["y"]:.0f} w={box["width"]:.0f} h={box["height"]:.0f}')
        # Get children
        children = el.query_selector_all(':scope > div')
        print(f'      children: {len(children)}')
        for j, child in enumerate(children):
            cbox = child.bounding_box()
            print(f'        child[{j}] x={cbox["x"]:.0f} y={cbox["y"]:.0f} w={cbox["width"]:.0f} h={cbox["height"]:.0f}')
    
    # Also check computed styles of first camel
    if els:
        camels = els[0].query_selector_all(':scope > div')
        if camels:
            first = camels[0]
            style = first.evaluate('el => window.getComputedStyle(el)')
            print('First camel computed style:')
            for k, v in list(style.items())[:10]:
                print(f'  {k}: {v}')
    
    browser.close()
