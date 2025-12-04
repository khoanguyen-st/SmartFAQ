# Quick Setup - Embedding Widget in Development

## TL;DR

Widget tự động được serve khi chạy `yarn dev` hoặc Docker - **không cần server riêng!**

## Local Development

### 1. Start web-student dev server (once)

```bash
cd apps/web-student
yarn dev
```

Widget sẽ available tại: `http://localhost:5173/chat-widget.js`

### 2. Add to your HTML

```html
<script src="http://localhost:5173/chat-widget.js"></script>
<script>
  window.addEventListener('load', function () {
    if (window.ChatWidget) {
      window.ChatWidget.init({
        apiBaseUrl: 'http://localhost:8000'
      })
    }
  })
</script>
```

### 3. That's it!

Run your app and the widget will appear.

## Updating Widget

After making changes to widget code:

**Local:**

```bash
cd apps/web-student
yarn build-widget
```

**Docker:**

```bash
# From project root
docker-compose exec web-student yarn build-widget

# Or use helper script
cd apps/web-student
./scripts/rebuild-widget-docker.sh
```

Reload your browser - changes take effect immediately!

## Docker Development

### First Time Setup

```bash
# From project root
docker-compose up web-student
```

The container automatically:

1. Builds widget during image build
2. Checks for widget on startup
3. Serves widget at `http://localhost:5173/chat-widget.js`

### After Widget Code Changes

```bash
# Rebuild widget inside container
docker-compose exec web-student yarn build-widget

# Or use the helper script
./apps/web-student/scripts/rebuild-widget-docker.sh
```

### Rebuild Container (if needed)

```bash
# Rebuild image (includes fresh widget build)
docker-compose build web-student

# Restart container
docker-compose up web-student
```

## Examples

### web-admin (already configured)

```bash
# Terminal 1: Start web-student
cd apps/web-student
yarn dev

# Terminal 2: Start web-admin
cd apps/web-admin
yarn dev
```

Visit `http://localhost:5174` - widget appears automatically!

### example.html

```bash
# Terminal 1: Start web-student
cd apps/web-student
yarn dev

# Terminal 2: Serve example.html
cd apps/web-student
npx serve . -l 3000
```

Visit `http://localhost:3000/example.html` - beautiful demo page with widget!

## Troubleshooting

**Widget doesn't load?**

- Check web-student dev server is running (`yarn dev`)
- Widget URL should be `http://localhost:5173/chat-widget.js`
- Check browser console for CORS errors

**Changes not showing?**

- Run `yarn build-widget` after code changes
- Hard refresh browser (Cmd+Shift+R)

**First time setup?**

- Run `yarn build-widget` once to create the initial widget file
- File is auto-copied to `public/chat-widget.js`
