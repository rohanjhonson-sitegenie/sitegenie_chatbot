# Development Setup for SiteGenie Chatbot

## CORS Issue Solution

Since the Flask API at `https://flaskapi.sitegenie.ai` doesn't include CORS headers for `http://localhost:3000`, we need to disable web security for development.

## Quick Start

1. **Start the React development server:**
   ```bash
   npm start
   ```

2. **Launch Chrome with disabled web security:**
   ```bash
   npm run dev
   ```
   OR double-click: `launch-dev.bat`

## What This Does

- Opens Chrome with `--disable-web-security` flag
- Creates a temporary user profile for development
- Automatically navigates to `http://localhost:3000`
- Allows API calls to `https://flaskapi.sitegenie.ai` without CORS errors

## Important Notes

⚠️ **WARNING**: Only use this for development. Never browse the web with disabled security.

✅ **Safe for development**: This creates an isolated Chrome session just for testing your app.

## Alternative Methods

If you prefer not to disable web security, ask your backend team to add these CORS headers to the Flask API:

```python
from flask_cors import CORS
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])
```

## Production

In production, this CORS issue won't exist because your frontend and backend will be served from the same domain.