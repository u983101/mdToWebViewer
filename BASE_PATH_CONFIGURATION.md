# Base Path Configuration

## Overview

The markdown server now supports serving from a configurable base path instead of the root `/`. This allows you to deploy the application under a specific path like `/myapp` instead of the root domain.

## Configuration

### Environment Variable

Set the `APP_NAME` environment variable to configure the base path:

```bash
# Linux/macOS
export APP_NAME=myapp
node app.js

# Windows Command Prompt
set APP_NAME=myapp
node app.js

# Windows PowerShell
$env:APP_NAME="myapp"
node app.js

# One-time execution
APP_NAME=myapp node app.js
```

### Default Behavior

If `APP_NAME` is not set, the application serves from the root path `/`:

```bash
node app.js
# Serves from: http://localhost:3000/
```

### Examples

```bash
# Serve from root
node app.js
# URL: http://localhost:3000/

# Serve from /docs
APP_NAME=docs node app.js
# URL: http://localhost:3000/docs

# Serve from /markdown-viewer
APP_NAME=markdown-viewer node app.js
# URL: http://localhost:3000/markdown-viewer
```

## URL Structure

With base path configuration, the URL structure changes:

### Without Base Path (Default)
```
http://localhost:3000/
http://localhost:3000/project1
http://localhost:3000/project1/sample-file.md
```

### With Base Path (APP_NAME=myapp)
```
http://localhost:3000/myapp/
http://localhost:3000/myapp/project1
http://localhost:3000/myapp/project1/sample-file.md
```

## Features

### Navigation Links
All navigation links automatically include the base path:
- Home links point to `/{base-path}/`
- Directory links point to `/{base-path}/{directory}`
- File links point to `/{base-path}/{file}.md`

### Static Assets
CSS and other static files are served from:
```
/{base-path}/styles.css
/{base-path}/other-assets/
```

### Error Pages
All error pages (400, 403, 404) include the base path in their navigation and styling.

## Use Cases

### 1. Subdirectory Deployment
When deploying to a subdirectory on a web server:
```bash
APP_NAME=markdown-viewer node app.js
```

### 2. Multiple Instances
Run multiple instances on the same server with different base paths:
```bash
# Instance 1
APP_NAME=project1 node app.js

# Instance 2  
APP_NAME=project2 node app.js
```

### 3. Reverse Proxy
When using a reverse proxy like Nginx:
```nginx
location /myapp/ {
    proxy_pass http://localhost:3000/myapp/;
}
```

## Docker Usage

When using Docker, set the environment variable:

```dockerfile
# Dockerfile
ENV APP_NAME=myapp
```

Or when running:
```bash
docker run -e APP_NAME=myapp -p 3000:3000 your-image
```

## Testing

### Verify Base Path Configuration
Start the server with a base path:
```bash
APP_NAME=testapp node app.js
```

You should see:
```
Markdown server running on http://localhost:3000/testapp
Base path configured: /testapp
```

### Test URLs
- Home: `http://localhost:3000/testapp/`
- Navigation: All links should include `/testapp/`
- CSS: `http://localhost:3000/testapp/styles.css`

## Troubleshooting

### Common Issues

1. **404 Errors on Static Files**
   - Ensure static file serving is configured with base path
   - Check that CSS links include the base path

2. **Navigation Links Broken**
   - Verify the `generateNavigationHTML` function uses `BASE_PATH`
   - Check that all href attributes include the base path

3. **Base Path Not Applied**
   - Confirm `APP_NAME` environment variable is set
   - Check server startup message for base path configuration

### Debug Mode
Add logging to verify base path handling:
```javascript
console.log('BASE_PATH:', BASE_PATH);
console.log('Requested path:', req.path);
console.log('Processed path:', requestedPath);
```

## Related Files

- `app.js` - Main server with base path support
- `package.json` - Application configuration
- `public/styles.css` - Static assets served with base path

## Migration Notes

If upgrading from a version without base path support:

1. Set `APP_NAME` to empty string for root deployment
2. Update any hardcoded URLs to use the base path
3. Test navigation and static file serving
