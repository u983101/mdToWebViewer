const express = require('express');
const fs = require('fs');
const path = require('path');
const marked = require('marked');

const app = express();
const PORT = process.env.APP_PORT || 8082;
const APP_NAME = process.env.APP_NAME || '';
const BASE_PATH = APP_NAME ? `/${APP_NAME}` : '';
const MD_DIR = path.join(__dirname, 'md');

// Function to get GitHub URL from settings
function getGitHubUrl() {
  try {
    const settingsPath = path.join(MD_DIR, 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      return settings.github?.url || null;
    }
  } catch (error) {
    console.error('Error reading settings.json:', error);
  }
  return null;
}

// Function to get deployment URL from settings
function getDeploymentUrl() {
  try {
    const settingsPath = path.join(MD_DIR, 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      return settings.deployment?.url || null;
    }
  } catch (error) {
    console.error('Error reading settings.json:', error);
  }
  return null;
}

// Function to generate GitHub edit URL
function generateGitHubEditUrl(filePath) {
  const githubUrl = getGitHubUrl();
  if (!githubUrl) return null;
  
  // Convert local file path to GitHub path
  const relativePath = path.relative(MD_DIR, filePath);
  
  // GitHub edit URL format: https://github.com/user/repo/edit/branch/path/to/file.md
  // For now, we'll use the main branch and assume the file structure matches
  return `${githubUrl}/edit/main/md/${relativePath}`;
}

// Function to read timezone component HTML
function getTimezoneComponentHTML() {
  try {
    const timezonePath = path.join(__dirname, 'public', 'timezone-component.html');
    if (fs.existsSync(timezonePath)) {
      return fs.readFileSync(timezonePath, 'utf8');
    }
  } catch (error) {
    console.error('Error reading timezone component:', error);
  }
  return '';
}

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
    
    // Add search box
    html += '<div class="search-container">\n';
    html += `<input type="text" id="search-input" placeholder="Search markdown files..." class="search-input">\n`;
    html += '<button id="search-button" class="search-button">Search</button>\n';
    html += '</div>\n';
    
    html += '<ul class="nav-tree">\n';

    // Add root directory
    const isRootActive = currentPath === '' || currentPath === '/';
    html += `<li><a href="${BASE_PATH}/" class="${isRootActive ? 'active' : ''}">Home</a></li>\n`;
    
    // Add "Navigate Up" link if we're in a subfolder
    if (currentPath && currentPath !== '') {
      const parentPath = currentPath.includes('/') ? currentPath.substring(0, currentPath.lastIndexOf('/')) : '';
      html += `<li><a href="${BASE_PATH}/${parentPath}" class="navigate-up">⬆ Navigate Up</a></li>\n`;
    }
    
  // Add files for current directory
  // Determine which directory's files to show:
  // - If we're viewing a file, show files from its parent directory
  // - If we're viewing a directory index, show files from that directory
  let filesDirPath = currentPath;
  
  // Check if currentPath represents a directory (has no file extension and is not empty)
  const isDirectoryPath = currentPath === '' || 
                         (currentPath.includes('/') && !currentPath.endsWith('.md')) ||
                         (!currentPath.includes('/') && !currentPath.endsWith('.md'));
  
  if (isDirectoryPath) {
    // We're viewing a directory index - show files from this directory
    filesDirPath = currentPath;
  } else {
    // We're viewing a file - show files from its parent directory
    filesDirPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
  }
  
  const currentFiles = getCurrentDirectoryFiles(filesDirPath);
    if (currentFiles.length > 0) {
      html += '<li class="file-section">\n';
      html += '<ul class="file-list">\n';
      for (const file of currentFiles) {
        // Skip index.md since it's already handled as "Home" or directory index
        if (file.name !== 'index') {
          const isFileActive = currentPath === file.path;
          html += `<li><a href="${BASE_PATH}/${file.path}.md" class="${isFileActive ? 'active' : ''}">${file.name}</a></li>\n`;
        }
      }
      html += '</ul>\n';
      html += '</li>\n';
    }
  }
  
  // Add directories - only show directories that are direct children of current directory
  for (const dir of directories) {
    const isActive = currentPath === dir.path || currentPath.startsWith(dir.path + '/');
    const hasChildren = dir.children && dir.children.length > 0;
    const hasFiles = getCurrentDirectoryFiles(dir.path).length > 0;
    const hasContent = hasChildren || hasFiles;
    const href = dir.hasIndex ? `${BASE_PATH}/${dir.path}` : '#';
    const className = dir.hasIndex ? (isActive ? 'active' : '') : 'no-index';
    
    // Only show directories that are direct children of current directory
    let isDirectChild = false;
    
    if (level === 0) {
      // At top level, show all directories
      isDirectChild = true;
    } else if (currentPath === '' && level === 0) {
      // At root level, show all directories
      isDirectChild = true;
    } else if (currentPath && dir.path.startsWith(currentPath)) {
      // Check if this directory is a direct child of current directory
      const relativePath = dir.path.substring(currentPath.length + 1);
      isDirectChild = relativePath.split('/').length === 1;
    }
    
    if (isDirectChild) {
      html += `<li class="nav-item">\n`;
      
      if (hasContent) {
        html += `<div class="folder-header">\n`;
        html += `<span class="folder-toggle">▶</span>\n`;
        html += `<a href="${href}" class="${className}">${dir.name}</a>\n`;
        html += `</div>\n`;
        
        // Only show contents if this directory is active (we're inside it)
        if (isActive) {
          html += `<ul class="folder-contents expanded">\n`;
          
          // Recursively add subdirectories for this active directory
          if (hasChildren) {
            html += generateNavigationHTML(dir.children, currentPath, level + 1);
          }
          
          html += '</ul>\n';
        }
      } else {
        // Directory with no content (no files or subdirectories)
        html += `<a href="${href}" class="${className}">${dir.name}</a>\n`;
      }
      
      html += `</li>\n`;
    }
  }
  
  if (level === 0) {
    html += '</ul>\n';
    
    // Add deployment URL at the bottom of navigation
    const deploymentUrl = getDeploymentUrl();
    if (deploymentUrl) {
      html += '<div class="deployment-info">\n';
      html += '<div class="deployment-label">Deployment URL:</div>\n';
      html += `<a href="${deploymentUrl}" target="_blank" rel="noopener noreferrer" class="deployment-link">${deploymentUrl}</a>\n`;
      html += '</div>\n';
    }
    
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

// Function to search markdown files
function searchMarkdownFiles(searchTerm) {
  const results = [];
  
  function searchDirectory(dirPath, relativePath = '') {
    try {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          // Recursively search subdirectories
          const newRelativePath = relativePath ? path.join(relativePath, item.name) : item.name;
          searchDirectory(fullPath, newRelativePath);
        } else if (item.isFile() && item.name.endsWith('.md')) {
          // Search in markdown file content
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const fileName = item.name.replace('.md', '');
            const fileRelativePath = relativePath ? path.join(relativePath, fileName) : fileName;
            
            // Check if search term exists in content (case insensitive)
            if (content.toLowerCase().includes(searchTerm.toLowerCase())) {
              // Find matching lines with context
              const lines = content.split('\n');
              const matchingLines = [];
              
              for (let i = 0; i < lines.length; i++) {
                if (lines[i].toLowerCase().includes(searchTerm.toLowerCase())) {
                  // Get some context around the matching line
                  const start = Math.max(0, i - 2);
                  const end = Math.min(lines.length - 1, i + 2);
                  const context = lines.slice(start, end + 1).join('\n');
                  
                  matchingLines.push({
                    lineNumber: i + 1,
                    context: context
                  });
                }
              }
              
              results.push({
                name: fileName,
                path: fileRelativePath,
                fullPath: fullPath,
                matches: matchingLines.length,
                matchingLines: matchingLines
              });
            }
          } catch (error) {
            console.error(`Error reading file ${fullPath}:`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Error searching directory ${dirPath}:`, error);
    }
  }
  
  // Start search from the markdown directory
  searchDirectory(MD_DIR);
  
  // Sort by number of matches (descending)
  return results.sort((a, b) => b.matches - a.matches);
}

// Search endpoint (handle both with and without base path)
app.get(`${BASE_PATH}/search`, (req, res) => {
  const searchTerm = req.query.q;
  
  if (!searchTerm || searchTerm.trim() === '') {
    return res.redirect(`${BASE_PATH}/`);
  }
  
  const searchResults = searchMarkdownFiles(searchTerm.trim());
  
  // Get directory structure for navigation
  const directories = getDirectoryStructure(MD_DIR);
  
  // Generate navigation HTML
  const navigationHTML = generateNavigationHTML(directories, '');
  
  // Generate search results HTML
  let searchResultsHTML = '';
  
  if (searchResults.length === 0) {
    searchResultsHTML = `
      <div class="search-results">
        <h1>Search Results for "${searchTerm}"</h1>
        <p>No results found.</p>
        <p><a href="${BASE_PATH}/">Return to Home</a></p>
      </div>
    `;
  } else {
    searchResultsHTML = `
      <div class="search-results">
        <h1>Search Results for "${searchTerm}"</h1>
        <p>Found ${searchResults.length} file(s) containing "${searchTerm}"</p>
        <div class="search-results-list">
    `;
    
    for (const result of searchResults) {
      searchResultsHTML += `
        <div class="search-result-item">
          <h3><a href="${BASE_PATH}/${result.path}.md">${result.name}</a></h3>
          <p class="search-result-path">${result.path}</p>
          <p class="search-result-matches">${result.matches} match(es)</p>
          <div class="search-result-preview">
      `;
      
      // Show first few matching lines as preview
      for (let i = 0; i < Math.min(result.matchingLines.length, 3); i++) {
        const match = result.matchingLines[i];
        searchResultsHTML += `
          <div class="match-preview">
            <span class="line-number">Line ${match.lineNumber}:</span>
            <pre class="match-context">${match.context}</pre>
          </div>
        `;
      }
      
      searchResultsHTML += `
          </div>
        </div>
      `;
    }
    
    searchResultsHTML += `
        </div>
      </div>
    `;
  }
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Search Results for "${searchTerm}" - Markdown Server</title>
      <link rel="stylesheet" href="${BASE_PATH}/styles.css">
    </head>
    <body>
      <div class="container">
        ${navigationHTML}
        <div class="content">
          ${searchResultsHTML}
        </div>
      </div>
      <script src="${BASE_PATH}/navigation.js"></script>
    </body>
    </html>
  `);
});

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
  
  // Generate GitHub edit link
  const githubEditUrl = generateGitHubEditUrl(filePath);
  const editLinkHtml = githubEditUrl ? `
    <div class="github-edit-link">
      <a href="${githubEditUrl}" target="_blank" rel="noopener noreferrer">
        ✏️ Edit this page on GitHub
      </a>
    </div>
  ` : '';
  
  // Generate time zone component HTML
  const timeZoneComponent = getTimezoneComponentHTML();

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
          ${timeZoneComponent}
          ${markdownContent}
          ${editLinkHtml}
        </div>
      </div>
      <script src="${BASE_PATH}/navigation.js"></script>
      <script src="${BASE_PATH}/timezone-component.js"></script>
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
