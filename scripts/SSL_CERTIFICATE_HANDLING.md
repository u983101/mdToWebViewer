# Handling Self-Signed Certificates in Confluence Upsert

## Overview

When upserting into Confluence instances that use self-signed SSL certificates, you may encounter certificate validation errors. This document explains how to handle these errors in your Confluence upsert script.

## The Problem

Self-signed certificates are not trusted by default by Node.js/axios, which causes SSL certificate validation errors like:

```
Error: self-signed certificate in certificate chain
Error: unable to verify the first certificate
```

## Solution

The Confluence upsert script now includes an option to ignore SSL certificate errors for development or internal environments with self-signed certificates.

### How It Works

1. **Modified ConfluenceClient**: The `ConfluenceClient` class now accepts an `ignoreSSL` parameter
2. **Interactive Prompt**: Users are prompted during authentication to choose whether to ignore SSL errors
3. **Axios Configuration**: When `ignoreSSL: true`, an HTTPS agent with `rejectUnauthorized: false` is used

### Usage

When running the upsert script:

```bash
cd scripts
node confluence-upsert.js
```

During the authentication phase, you'll be prompted:

```
Confluence username or email: your-username
Confluence password or API token: [hidden]
Ignore SSL certificate errors (for self-signed certificates)? (Y/n)
```

- **Yes (Y)**: SSL certificate validation is disabled, allowing connection to servers with self-signed certificates
- **No (n)**: SSL certificate validation is enforced (default, recommended for production)

### Technical Implementation

The solution uses Node.js's built-in `https` module to create a custom agent:

```javascript
import https from 'https';

// In ConfluenceClient constructor
if (auth.ignoreSSL) {
  console.log('⚠️  SSL certificate validation is disabled - using self-signed certificate workaround');
  axiosConfig.httpsAgent = new https.Agent({
    rejectUnauthorized: false
  });
}
```

## Security Considerations

⚠️ **Important Security Warning**: Disabling SSL certificate validation exposes you to potential man-in-the-middle attacks. Only use this option in the following scenarios:

- Development environments
- Internal networks with trusted self-signed certificates
- Testing environments
- When you fully trust the network connection

**Do NOT use this option for:**
- Production environments
- Public internet connections
- Untrusted networks

## Alternative Approaches

For production environments, consider these alternatives instead of disabling SSL validation:

1. **Install the Self-Signed Certificate**: Add the certificate to your system's trusted certificate store
2. **Use Environment Variables**: Set `NODE_TLS_REJECT_UNAUTHORIZED=0` (not recommended for production)
3. **Use a Reverse Proxy**: Set up a reverse proxy with proper SSL termination

## Testing

You can test the SSL ignore functionality using the provided test script:

```bash
cd scripts
node test-ssl-ignore.js
```

This will verify that the SSL ignore option works correctly without making actual API calls.

## Troubleshooting

### Common Issues

1. **Connection still fails after enabling ignoreSSL**:
   - Verify the Confluence URL is correct
   - Check network connectivity
   - Ensure the server is accessible

2. **Certificate errors in production**:
   - Never use `ignoreSSL: true` in production
   - Use properly signed certificates
   - Consider using Let's Encrypt for free SSL certificates

3. **Mixed content warnings**:
   - Ensure all resources use HTTPS
   - Check for HTTP links in your content

## Best Practices

1. **Development**: Use `ignoreSSL: true` only for local development
2. **Staging**: Use proper certificates even in staging environments
3. **Production**: Always use valid, trusted SSL certificates
4. **Monitoring**: Monitor for SSL-related errors in logs

## Related Files

- `scripts/utils/confluence-client.js` - Main client implementation
- `scripts/utils/prompt-utils.js` - Authentication prompts
- `scripts/test-ssl-ignore.js` - Test script for SSL functionality
- `scripts/confluence-upsert.js` - Main upsert script
