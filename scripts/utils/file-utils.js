import fs from 'fs-extra';
import path from 'path';
import { marked } from 'marked';

/**
 * File utilities for reading markdown files, settings, and directory structure
 */

/**
 * Get all subfolders in the md directory
 * @returns {Promise<string[]>} Array of subfolder names
 */
export async function getSubfolders() {
  try {
    const mdPath = path.join(process.cwd(), '..', 'md');
    const items = await fs.readdir(mdPath);
    
    const subfolders = [];
    for (const item of items) {
      const itemPath = path.join(mdPath, item);
      const stats = await fs.stat(itemPath);
      if (stats.isDirectory() && item !== '.' && item !== '..') {
        subfolders.push(item);
      }
    }
    
    return subfolders;
  } catch (error) {
    console.error('Error reading subfolders:', error.message);
    throw error;
  }
}

/**
 * Read settings.json from a subfolder
 * @param {string} folderName - Name of the subfolder
 * @returns {Promise<Object>} Settings object
 */
export async function readSettings(folderName) {
  try {
    const settingsPath = path.join(process.cwd(), '..', 'md', folderName, 'settings.json');
    
    if (!(await fs.pathExists(settingsPath))) {
      throw new Error(`settings.json not found in ${folderName}`);
    }
    
    const settingsContent = await fs.readFile(settingsPath, 'utf8');
    const settings = JSON.parse(settingsContent);
    
    // Validate required confluence settings
    if (!settings.confluence || !settings.confluence.space) {
      throw new Error(`Invalid settings.json in ${folderName}: missing confluence.space`);
    }
    
    return settings;
  } catch (error) {
    console.error(`Error reading settings for ${folderName}:`, error.message);
    throw error;
  }
}

/**
 * Recursively read all markdown files and folder information in a folder
 * @param {string} folderPath - Path to the folder
 * @param {string} basePath - Base path for relative paths
 * @returns {Promise<{files: FileInfo[], folders: FolderInfo[]}>} Object containing files and folders
 */
export async function readMarkdownFiles(folderPath, basePath = folderPath) {
  try {
    const files = [];
    const folders = [];
    const items = await fs.readdir(folderPath);
    
    // First, process the current folder itself
    const currentFolderRelativePath = path.relative(basePath, folderPath);
    if (currentFolderRelativePath !== '') {
      const folderName = path.basename(folderPath);
      folders.push({
        path: folderPath,
        relativePath: currentFolderRelativePath,
        title: getFolderTitle(folderName),
        parentPath: path.dirname(currentFolderRelativePath) !== '.' ? path.dirname(currentFolderRelativePath) : undefined
      });
    }
    
    for (const item of items) {
      const itemPath = path.join(folderPath, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        // Recursively read subdirectories
        const { files: subFiles, folders: subFolders } = await readMarkdownFiles(itemPath, basePath);
        files.push(...subFiles);
        folders.push(...subFolders);
      } else if (item.endsWith('.md')) {
        // Read markdown file
        const content = await fs.readFile(itemPath, 'utf8');
        const relativePath = path.relative(basePath, itemPath);
        const title = getTitleFromContent(content, item);
        const parentPath = path.dirname(relativePath) !== '.' ? path.dirname(relativePath) : undefined;
        
        files.push({
          path: itemPath,
          relativePath: relativePath,
          content: content,
          title: title,
          parentPath: parentPath,
          type: 'file'
        });
      }
    }
    
    return { files, folders };
  } catch (error) {
    console.error(`Error reading markdown files from ${folderPath}:`, error.message);
    throw error;
  }
}

/**
 * Extract title from markdown content
 * @param {string} content - Markdown content
 * @param {string} filename - Filename as fallback
 * @returns {string} Title
 */
function getTitleFromContent(content, filename) {
  // Try to extract from first heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }
  
  // Fallback to filename without extension
  return path.basename(filename, '.md').replace(/[-_]/g, ' ');
}

/**
 * Generate title for folder based on directory name
 * @param {string} folderName - Directory name
 * @returns {string} Folder title
 */
function getFolderTitle(folderName) {
  return folderName.replace(/[-_]/g, ' ');
}

/**
 * Convert markdown to Confluence storage format
 * @param {string} markdown - Markdown content
 * @returns {string} Confluence storage format HTML
 */
export function convertMarkdownToConfluenceStorage(markdown) {
  try {
    // Convert markdown to HTML
    const html = marked(markdown);
    
    // Basic Confluence storage format wrapper
    // Note: This is a simplified version. Real Confluence storage format
    // includes more specific markup and attributes
//     return `<ac:structured-macro ac:name="markdown">
//   <ac:parameter ac:name="atlassian-macro-output-type">INLINE</ac:parameter>
//   <ac:rich-text-body>
//     <![CDATA[${html}]]>
//   </ac:rich-text-body>
// </ac:structured-macro>`;

    return html.replace(/<br>/g, "<br/>").replace(/<input disabled="" type="checkbox">/g, '');
  } catch (error) {
    console.error('Error converting markdown to Confluence format:', error.message);
    throw error;
  }
}
