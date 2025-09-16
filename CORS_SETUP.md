# CORS Configuration Guide

This guide explains how to configure CORS on your Flask API server (`https://flaskapi.sitegenie.ai`) to allow requests from both your local development environment and production deployment.

## Overview

Your chatbot now calls the Flask API directly from:
- **Local Development**: `http://localhost:3000`
- **Production**: `https://sitegenie-chatbot.vercel.app`

## Required CORS Configuration

Add the following CORS configuration to your Flask API server:

### Option 1: Using Flask-CORS (Recommended)

```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

# Configure CORS for specific origins
CORS(app, origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://sitegenie-chatbot.vercel.app"
],
supports_credentials=True,
allow_headers=["Content-Type", "Authorization", "x-thread-id", "thread-id"],
expose_headers=["x-thread-id", "thread-id"])
```

### Option 2: Manual CORS Headers

If you prefer to handle CORS manually:

```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.after_request
def after_request(response):
    # Allow these origins
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://sitegenie-chatbot.vercel.app"
    ]

    origin = request.headers.get('Origin')
    if origin in allowed_origins:
        response.headers.add('Access-Control-Allow-Origin', origin)

    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-thread-id,thread-id')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Expose-Headers', 'x-thread-id,thread-id')

    return response

@app.route('/process_query', methods=['OPTIONS'])
def handle_options():
    return '', 200

@app.route('/upload', methods=['OPTIONS'])
def handle_upload_options():
    return '', 200
```

## Key Points

### 1. **Allowed Origins**
```
- http://localhost:3000          (Local development)
- http://127.0.0.1:3000         (Alternative local)
- https://sitegenie-chatbot.vercel.app  (Production)
```

### 2. **Important Headers**
- **Allow Headers**: `Content-Type`, `Authorization`, `x-thread-id`, `thread-id`
- **Expose Headers**: `x-thread-id`, `thread-id` (for thread ID capture)
- **Allow Methods**: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- **Allow Credentials**: `true` (if using authentication)

### 3. **Preflight Requests**
Handle `OPTIONS` requests for both endpoints:
- `/process_query` (for chat messages)
- `/upload` (for file uploads)

## Testing CORS Configuration

### Test from Browser Console

Open your browser's developer console and run:

```javascript
// Test from localhost:3000
fetch('https://flaskapi.sitegenie.ai/process_query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'test',
    assistant_id: 'your-assistant-id',
    company_id: 'your-company-id'
  })
})
.then(response => console.log('Success:', response.status))
.catch(error => console.error('CORS Error:', error));
```

### Test with curl

```bash
# Test preflight request
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://flaskapi.sitegenie.ai/process_query

# Should return CORS headers in response
```

## Common CORS Issues

### 1. **Missing OPTIONS Handler**
**Problem**: Browser sends preflight OPTIONS request but server doesn't handle it
**Solution**: Add OPTIONS route handlers for your endpoints

### 2. **Wildcard with Credentials**
**Problem**: Using `Access-Control-Allow-Origin: *` with `credentials: true`
**Solution**: Specify exact origins instead of wildcard

### 3. **Missing Exposed Headers**
**Problem**: Thread IDs not accessible in browser
**Solution**: Add `x-thread-id` and `thread-id` to exposed headers

### 4. **Case Sensitivity**
**Problem**: Header names are case-sensitive
**Solution**: Use exact header names as shown above

## Deployment Notes

### Development
- CORS allows `http://localhost:3000`
- No proxy server needed
- Direct API calls work

### Production
- CORS allows `https://sitegenie-chatbot.vercel.app`
- SSL/HTTPS required for production domain
- Same direct API calls work

## Troubleshooting

### Check Browser Network Tab
1. Look for preflight OPTIONS requests
2. Verify response includes CORS headers
3. Check for 200 status on OPTIONS

### Common Error Messages
- `"blocked by CORS policy"` → Missing/incorrect CORS headers
- `"preflight request doesn't pass"` → OPTIONS handler issue
- `"credentials mode 'include'"` → Credential handling issue

### Debug Steps
1. Test API endpoints directly (Postman/curl)
2. Check browser console for CORS errors
3. Verify CORS headers in Network tab
4. Test both localhost and production domains

## Security Considerations

- Only allow necessary origins (don't use wildcards in production)
- Regularly review and update allowed origins
- Use HTTPS for all production communications
- Consider implementing proper authentication if not already present

## Support

If you continue experiencing CORS issues:
1. Share the exact error message from browser console
2. Provide Network tab screenshot showing request/response headers
3. Confirm your Flask API CORS configuration matches this guide

Once CORS is properly configured on your Flask API, your chatbot will work seamlessly from both localhost and production without any proxy servers.