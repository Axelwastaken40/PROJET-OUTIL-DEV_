Place image files here to use them in the game UI.

Expected filenames (optional):
- `map.jpg` or `map.png` — large map image to display on the wall (recommended aspect ~ 3:2)
- `lenin.jpg` or `lenin.png` — portrait image for Lenin
- `stalin.jpg` or `stalin.png` — portrait image for Stalin

If these files are present the game will draw them on the wall; otherwise it uses stylized placeholders.

To add the images:
1. Copy your image files into this `assets` folder.
2. Start (or restart) the local server: `powershell -ExecutionPolicy Bypass -File server.ps1`
3. Open `http://localhost:8000` and refresh the page.

Notes:
- Filenames are case-sensitive in some environments; use lowercase names to be safe.
- Use JPG or PNG. Large images will be scaled down in the browser.
