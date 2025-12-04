# Chat Widget Embed Instructions

## Overview

The SmartFAQ Chat Widget is a standalone embeddable component that can be integrated into any website. It uses Shadow DOM to prevent CSS conflicts with the host page.

## Quick Start

### 1. Build the Widget

```bash
cd apps/web-student
yarn build-widget
```

This generates `dist/widget/chat-widget.js` - a single JavaScript file containing the entire widget.

### 2. Embed in Your Website

Add this code to your HTML page (before closing `</body>` tag):

```html
<!-- Load the Chat Widget -->
<script src="https://your-cdn.com/chat-widget.js"></script>

<!-- Initialize the Widget -->
<script>
  window.ChatWidget.init({
    apiBaseUrl: 'https://api.smartfaq.dev.devplus.edu.vn',
    position: {
      bottom: '20px',
      right: '20px'
    },
    zIndex: 9999
  })
</script>
```

## Configuration Options

### `apiBaseUrl` (optional)

- **Type:** `string`
- **Default:** `http://localhost:8000`
- **Description:** The base URL of your SmartFAQ API backend

### `position` (optional)

- **Type:** `{ bottom?: string, right?: string, left?: string, top?: string }`
- **Default:** `{ bottom: '0', right: '0' }`
- **Description:** Widget position on the page. Use CSS values like `'20px'`, `'1rem'`, etc.

### `zIndex` (optional)

- **Type:** `number`
- **Default:** `2147483647`
- **Description:** CSS z-index value for the widget

## Examples

### Default Position (Bottom Right)

```html
<script src="/path/to/chat-widget.js"></script>
<script>
  window.ChatWidget.init({
    apiBaseUrl: 'https://api.smartfaq.dev.devplus.edu.vn'
  })
</script>
```

### Bottom Left Position

```html
<script src="/path/to/chat-widget.js"></script>
<script>
  window.ChatWidget.init({
    apiBaseUrl: 'https://api.smartfaq.dev.devplus.edu.vn',
    position: {
      bottom: '20px',
      left: '20px'
    }
  })
</script>
```

### Top Right Position with Custom z-index

```html
<script src="/path/to/chat-widget.js"></script>
<script>
  window.ChatWidget.init({
    apiBaseUrl: 'https://api.smartfaq.dev.devplus.edu.vn',
    position: {
      top: '80px',
      right: '20px'
    },
    zIndex: 1000
  })
</script>
```

## Deployment

### Option 1: CDN Deployment

1. Build the widget: `yarn build-widget`
2. Upload `dist/widget/chat-widget.js` to your CDN
3. Use the CDN URL in your embed code

### Option 2: Self-Hosted

1. Build the widget: `yarn build-widget`
2. Copy `dist/widget/chat-widget.js` to your web server's static files directory
3. Reference the local path in your embed code

### Option 3: Cloudflare Pages (Recommended)

The widget is automatically deployed to Cloudflare Pages on push to main branch.

Production URL: `https://chat-widget.smartfaq.pages.dev/chat-widget.js`

## Features

- ✅ **Isolated Styles** - Uses Shadow DOM to prevent CSS conflicts
- ✅ **Responsive Design** - Works on desktop and mobile devices
- ✅ **Markdown Support** - Rich text formatting in responses
- ✅ **Multi-language** - Supports English and Vietnamese
- ✅ **Session Management** - Maintains chat history
- ✅ **Minimizable** - Can be collapsed when not in use

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+

## Troubleshooting

### Widget doesn't appear

- Check browser console for errors
- Verify the script URL is correct
- Ensure `window.ChatWidget.init()` is called after the script loads

### API connection failed

- Verify `apiBaseUrl` is correct and accessible
- Check CORS settings on your API server
- Ensure the API is running and healthy

### Style conflicts

The widget uses Shadow DOM which should prevent CSS conflicts. If you still see issues, try increasing the `zIndex` value.

## Support

For issues or questions, please contact the development team or create an issue in the repository.
