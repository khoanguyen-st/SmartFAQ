# Docker Setup for Chat Widget

## Overview

The Chat Widget is automatically built and served when running web-student in Docker.

## How It Works

### Image Build

1. Dockerfile runs `yarn build-widget` during image build
2. Widget is built to `dist/widget/chat-widget.js`
3. Copied to `public/chat-widget.js` via `postbuild-widget` hook

### Container Startup

1. `docker-entrypoint.sh` runs before dev server starts
2. Checks if `public/chat-widget.js` exists
3. Rebuilds if missing (shouldn't happen normally)
4. Starts Vite dev server

### Volume Mounting

```yaml
volumes:
  - ./apps/web-student/src:/app/src:cached
  - ./apps/web-student/public:/app/public:cached # Widget persistence
```

The `public/` folder is mounted so widget changes persist between container restarts.

## Usage

### Start Container

```bash
# From project root
docker-compose up web-student
```

Widget automatically available at: `http://localhost:5173/chat-widget.js`

### Rebuild Widget After Code Changes

```bash
# Method 1: Direct command
docker-compose exec web-student yarn build-widget

# Method 2: Helper script
./apps/web-student/scripts/rebuild-widget-docker.sh
```

### Rebuild Image (Fresh Start)

```bash
# Rebuild image (includes fresh widget build)
docker-compose build web-student

# Start container
docker-compose up web-student
```

## Testing Widget in Other Services

### web-admin Example

```bash
# Terminal 1: Start web-student (serves widget)
docker-compose up web-student

# Terminal 2: Start web-admin (loads widget)
docker-compose up web-admin
```

Visit `http://localhost:5174` - widget loads from web-student at port 5173.

## Troubleshooting

### Widget Not Loading

**Check widget file exists:**

```bash
docker-compose exec web-student ls -lh public/chat-widget.js
```

**Rebuild widget:**

```bash
docker-compose exec web-student yarn build-widget
```

**Check logs:**

```bash
docker-compose logs web-student | grep -i widget
```

### Widget Changes Not Showing

**Rebuild widget in container:**

```bash
docker-compose exec web-student yarn build-widget
```

**Hard refresh browser:**

- Chrome/Firefox: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)

### Container Won't Start

**Check entrypoint script permissions:**

```bash
ls -l apps/web-student/docker-entrypoint.sh
# Should show: -rwxr-xr-x
```

**Rebuild image:**

```bash
docker-compose build --no-cache web-student
docker-compose up web-student
```

## Files Involved

- `Dockerfile` - Builds widget during image build
- `docker-entrypoint.sh` - Checks widget on container start
- `docker-compose.yml` - Mounts `public/` folder for persistence
- `.dockerignore` - Excludes built widget from context (will rebuild)
- `scripts/rebuild-widget-docker.sh` - Helper for rebuilding in container

## Best Practices

1. **After widget code changes:** Run rebuild command, don't restart container
2. **Volume mounted files:** Changes in `src/` auto-reload, but widget needs rebuild
3. **Image rebuilds:** Only needed for Dockerfile changes or fresh start
4. **Production:** Use production Dockerfile that serves pre-built static files
