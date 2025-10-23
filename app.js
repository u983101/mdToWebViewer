const express = require('express');
const fs = require('fs');
const path = require('path');
const marked = require('marked');

const app = express();
const PORT = process.env.APP_PORT || 8082;
const APP_NAME = process.env.APP_NAME || '';
const BASE_PATH = APP_NAME ? `/${APP_NAME}` : '';
const MD_DIR = path.join(__dirname, 'md');

// Configure marked for markdown parsing
marked.setOptions({
  highlight: function(code, lang) {
    // Basic syntax highlighting - could be enhanced with a proper highlighter
    return `<pre><code class="language-${lang}">${code}</code></pre>`;
  }
});

// Serve static files from public directory with base path support
app.use(`${BASE_PATH}/`, express.static(path.join(__dirname, 'public')));

// Function to get hierarchical directory structure for navigation
function getDirectoryStructure(rootPath, basePath = '') {
  const structure = [];
  
  try {
    const items = fs.readdirSync(rootPath, { withFileTypes: true });
    
    for (const item of items) {
      if (item.isDirectory()) {
        const dirPath = path.join(rootPath, item.name);
        const relativePath = basePath ? path.join(basePath, item.name) : item.name;
        
        // Check if directory has index.md
        const hasIndex = fs.existsSync(path.join(dirPath, 'index.md'));
        
        const directory = {
          name: item.name,
          path: relativePath,
          hasIndex: hasIndex,
          isDirectory: true,
          children: getDirectoryStructure(dirPath, relativePath) // Recursively get children
        };
        
        structure.push(directory);
      }
    }
  } catch (error) {
    console.error('Error reading directory structure:', error);
  }
  
  return structure;
}

// Function to get files in current directory
function getCurrentDirectoryFiles(currentPath) {
  const files = [];
  
  try {
    const currentDirPath = currentPath === '' ? MD_DIR : path.join(MD_DIR, currentPath);
    
    if (fs.existsSync(currentDirPath) && fs.statSync(currentDirPath).isDirectory()) {
      const items = fs.readdirSync(currentDirPath, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isFile() && item.name.endsWith('.md')) {
          const fileName = item.name.replace('.md', '');
          const filePath = currentPath === '' ? fileName : path.join(currentPath, fileName);
          const isIndexFile = item.name === 'index.md';
          
          files.push({
            name: fileName,
            path: filePath,
            isDirectory: false,
            isIndexFile: isIndexFile
          });
        }
      }
    }
  } catch (error) {
    console.error('Error reading current directory files:', error);
  }
  
  return files;
}

// Function to generate hierarchical navigation HTML with collapsible folders
function generateNavigationHTML(directories, currentPath, level = 0) {
  let html = '';
  
  if (level === 0) {
    html = '<nav class="navigation">\n';
    html += '<h2>Navigation</h2>\n';
    html += '<ul class="nav-tree">\n';

    // Add root directory
    const isRootActive = currentPath === '' || currentPath === '/';
    html += `<li><a href="${BASE_PATH}/" class="${isRootActive ? 'active' : ''}">Home</a></li>\n`;
  }
  
  // Add all directories recursively
  for (const dir of directories) {
    const isActive = currentPath === dir.path || currentPath.startsWith(dir.path + '/');
    const hasChildren = dir.children && dir.children.length > 0;
    const hasFiles = getCurrentDirectoryFiles(dir.path).length > 0;
    const hasContent = hasChildren || hasFiles;
    const href = dir.hasIndex ? `${BASE_PATH}/${dir.path}` : '#';
    const className = dir.hasIndex ? (isActive ? 'active' : '') : 'no-index';
    
    html += `<li class="nav-item">\n`;
    
    if (hasContent) {
      html += `<div class="folder-header">\n`;
      html += `<span class="folder-toggle">▶</span>\n`;
      html += `<a href="${href}" class="${className}">${dir.name}</a>\n`;
      html += `</div>\n`;
      
      // Always show children and files (collapsed by default, expanded via CSS for active paths)
      html += `<ul class="folder-contents ${isActive ? 'expanded' : ''}">\n`;
      
      // Add files for this directory
      const dirFiles = getCurrentDirectoryFiles(dir.path);
      if (dirFiles.length > 0) {
        html += '<li class="file-section">\n';
        html += '<ul class="file-list">\n';
        for (const file of dirFiles) {
          const isFileActive = currentPath === file.path;
          html += `<li><a href="${BASE_PATH}/${file.path}.md" class="${isFileActive ? 'active' : ''}">${file.name}</a></li>\n`;
        }
        html += '</ul>\n';
        html += '</li>\n';
      }
      
      // Add subdirectories
      if (hasChildren) {
        html += generateNavigationHTML(dir.children, currentPath, level + 1);
      }
      
      html += '</ul>\n';
    } else {
      // Directory with no content (no files or subdirectories)
      html += `<a href="${href}" class="${className}">${dir.name}</a>\n`;
    }
    
    html += `</li>\n`;
  }
  
  if (level === 0) {
    html += '</ul>\n';
    html += '</nav>\n';
  }
  
  return html;
}

// Function to render markdown file
function renderMarkdownFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return marked.parse(content);
  } catch (error) {
    console.error('Error reading markdown file:', error);
    return null;
  }
}

// Main route handler for serving markdown content
app.get('*', (req, res) => {
  let requestedPath = req.path;
  
  // Remove base path from requested path if it exists
  if (BASE_PATH && requestedPath.startsWith(BASE_PATH)) {
    requestedPath = requestedPath.substring(BASE_PATH.length);
  }
  
  // Security: Prevent directory traversal attacks
  if (requestedPath.includes('..')) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>400 - Bad Request</title>
        <link rel="stylesheet" href="${BASE_PATH}/styles.css">
      </head>
      <body>
        <div class="container">
          <div class="navigation">
            <h2>Navigation</h2>
            <ul>
              <li><a href="${BASE_PATH}/">Home</a></li>
            </ul>
          </div>
          <div class="content">
            <h1>400 - Bad Request</h1>
            <p>Invalid path requested. Directory traversal is not allowed.</p>
            <p><a href="${BASE_PATH}/">Return to Home</a></p>
          </div>
        </div>
      </body>
      </html>
    `);
  }
  
  // Remove leading slash and handle root path
  if (requestedPath === '/') {
    requestedPath = '';
  } else {
    requestedPath = requestedPath.substring(1);
  }
  
  // Build the full file path
  let filePath;
  if (requestedPath === '') {
    // Root path - serve md/index.md
    filePath = path.join(MD_DIR, 'index.md');
  } else {
    // Check if path ends with .md extension
    if (requestedPath.endsWith('.md')) {
      filePath = path.join(MD_DIR, requestedPath);
    } else {
      // Assume it's a directory - look for index.md
      filePath = path.join(MD_DIR, requestedPath, 'index.md');
    }
  }
  
  // Validate file path is within the allowed directory
  if (!filePath.startsWith(MD_DIR)) {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>403 - Forbidden</title>
        <link rel="stylesheet" href="${BASE_PATH}/styles.css">
      </head>
      <body>
        <div class="container">
          <div class="navigation">
            <h2>Navigation</h2>
            <ul>
              <li><a href="${BASE_PATH}/">Home</a></li>
            </ul>
          </div>
          <div class="content">
            <h1>403 - Forbidden</h1>
            <p>Access to the requested resource is not allowed.</p>
            <p><a href="${BASE_PATH}/">Return to Home</a></p>
          </div>
        </div>
      </body>
      </html>
    `);
  }
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>404 - File Not Found</title>
        <link rel="stylesheet" href="${BASE_PATH}/styles.css">
      </head>
      <body>
        <div class="container">
          <div class="navigation">
            <h2>Navigation</h2>
            <ul>
              <li><a href="${BASE_PATH}/">Home</a></li>
            </ul>
          </div>
          <div class="content">
            <h1>404 - File Not Found</h1>
            <p>The requested file <code>${requestedPath || 'index.md'}</code> was not found.</p>
            <p><a href="${BASE_PATH}/">Return to Home</a></p>
          </div>
        </div>
      </body>
      </html>
    `);
  }
  
  // Get directory structure for navigation
  const directories = getDirectoryStructure(MD_DIR);
  
  // Determine which directory's files to show in navigation
  // If we're viewing a file, show files from its parent directory
  let navigationPath = requestedPath;
  if (requestedPath.includes('/')) {
    // If we're viewing a file within a subdirectory, get files from the parent directory
    navigationPath = requestedPath.substring(0, requestedPath.lastIndexOf('/'));
  }
  
  // Get files in the appropriate directory for navigation
  const currentFiles = getCurrentDirectoryFiles(navigationPath);
  
  // Generate navigation HTML
  const navigationHTML = generateNavigationHTML(directories, requestedPath);
  
  // Render markdown content
  const markdownContent = renderMarkdownFile(filePath);
  
  if (!markdownContent) {
    return res.status(500).send('Error reading markdown file');
  }
  
  // Send the complete HTML response
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${requestedPath || 'Home'} - Markdown Server</title>
      <link rel="stylesheet" href="${BASE_PATH}/styles.css">
    </head>
    <body>
      <div class="container">
        ${navigationHTML}
        <div class="content">
          ${markdownContent}
        </div>
      </div>
      <script src="${BASE_PATH}/navigation.js"></script>
    </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  const baseUrl = `http://localhost:${PORT}${BASE_PATH}`;
  console.log(`Markdown server running on ${baseUrl}`);
  console.log(`Serving markdown files from: ${MD_DIR}`);
  if (APP_NAME) {
    console.log(`Base path configured: ${BASE_PATH}`);
  }
});
