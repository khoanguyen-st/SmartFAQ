# Chat Widget Development Guide

## Development Workflow

### 1. Run the Widget in Dev Mode (Standalone)

For developing the widget itself:

```bash
cd apps/web-student
yarn dev
```

Visit `http://localhost:5173/` to see the widget in standalone mode.

**The widget is automatically available at `http://localhost:5173/chat-widget.js`** - Vite dev server serves it from the `public` folder!

### 2. Build Widget for Testing/Production

To rebuild the widget (updates `public/chat-widget.js` automatically):

```bash
cd apps/web-student
yarn build-widget
```

The `postbuild-widget` script automatically copies the built widget to `public/` so it's immediately available via the dev server.

### 3. Test Widget in Another App (e.g., web-admin)

Just run both dev servers - **no need for separate widget server**:

1. **Run web-student dev server** (this serves the widget):

```bash
cd apps/web-student
yarn dev
```

2. **Run the host app** (in a separate terminal):

```bash
cd apps/web-admin
yarn dev
```

3. Visit the host app - the widget loads from `http://localhost:5173/chat-widget.js`

**Note:** After making changes to widget code, run `yarn build-widget` to rebuild and the changes will be immediately available.

## Quick Commands

**Local Development:**

```bash
# Development mode (serves widget at /chat-widget.js)
yarn dev

# Rebuild widget after changes
yarn build-widget

# Build widget for production
yarn build-widget
```

**Docker Development:**

```bash
# Start container (auto-builds widget)
docker-compose up web-student

# Rebuild widget in container
docker-compose exec web-student yarn build-widget
# Or: ./scripts/rebuild-widget-docker.sh

# Rebuild image (fresh widget build)
docker-compose build web-student
```

## How It Works

**Local Development:**

1. `yarn build-widget` builds the widget to `dist/widget/chat-widget.js`
2. `postbuild-widget` hook automatically copies it to `public/chat-widget.js`
3. Vite dev server serves `public/` folder, so widget is available at `http://localhost:5173/chat-widget.js`
4. Other apps can load the widget from the web-student dev server (no separate server needed!)

**Docker Development:**

1. Dockerfile runs `yarn build-widget` during image build
2. `docker-entrypoint.sh` checks if widget exists on container start
3. Volume mount `./apps/web-student/public:/app/public` persists widget between restarts
4. Widget served by Vite dev server inside container at `http://localhost:5173/chat-widget.js`
5. After code changes, run `docker-compose exec web-student yarn build-widget` to rebuild

## File Structure

```
apps/web-student/
├── src/
│   ├── widget/
│   │   └── index.tsx          # Widget entry point
│   ├── components/
│   │   └── Chatbot/
│   │       ├── ChatWidget.tsx  # Main widget component
│   │       └── ChatContainer.tsx
│   ├── App.tsx                 # Main app component
│   └── styles.css              # Tailwind styles
├── dist/widget/
│   └── chat-widget.js          # Built widget (after build-widget)
├── EMBED_INSTRUCTIONS.md       # Instructions for embedding
└── vite.config.ts              # Vite config with widget build mode
```

## Configuration

### Widget Build (vite.config.ts)

The widget is built using Vite's library mode with IIFE format:

- **Entry**: `src/widget/index.tsx`
- **Output**: `dist/widget/chat-widget.js`
- **Format**: IIFE (Immediately Invoked Function Expression)
- **CSS**: Inlined using Shadow DOM

### Shadow DOM

The widget uses Shadow DOM to:

- Isolate CSS from the host page
- Prevent style conflicts
- Ensure consistent appearance across different sites

## Environment Variables

The widget respects these environment variables:

- `VITE_API_BASE_URL`: Default API endpoint (can be overridden in `init()`)

## Troubleshooting

### Widget doesn't load in host app

1. Check browser console for CORS errors
2. Ensure `npx serve` is running with `--cors` flag
3. Verify the script URL is correct in host app's HTML

### Styles don't apply

The widget uses Shadow DOM, so:

- Host page styles won't affect the widget
- Widget styles are self-contained
- Check `src/styles.css` for Tailwind config

### API calls fail

1. Verify `apiBaseUrl` in `init()` config
2. Check backend is running
3. Ensure CORS is enabled on API server

## Production Deployment

See `EMBED_INSTRUCTIONS.md` for deployment instructions.
