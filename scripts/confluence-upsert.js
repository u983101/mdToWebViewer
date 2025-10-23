#!/usr/bin/env node

/**
 * Main Confluence upsert script
 * 
 * This script allows users to upsert markdown files from subfolders to Confluence spaces.
 * It provides interactive prompts for subfolder selection and authentication.
 */

import path from 'path';
import { getSubfolders, readSettings, readMarkdownFiles, convertMarkdownToConfluenceStorage } from './utils/file-utils.js';
import { ConfluenceClient } from './utils/confluence-client.js';
import { 
  promptForSubfolder, 
  promptForAuth, 
  confirmUpsert, 
  promptToContinue,
  promptForRetry,
  promptForFileSelection
} from './utils/prompt-utils.js';

/**
 * Main function - entry point for the script
 */
async function main() {
  console.log('🚀 Confluence Markdown Upsert Tool\n');
  
  try {
    // Step 1: Get available subfolders
    console.log('📁 Scanning for subfolders...');
    const subfolders = await getSubfolders();
    console.log(`✅ Found ${subfolders.length} subfolder(s): ${subfolders.join(', ')}`);

    // Step 2: Prompt user to select a subfolder
    const selectedFolder = await promptForSubfolder(subfolders);
    console.log(`📂 Selected folder: ${selectedFolder}`);

    // Step 3: Read settings from selected folder
    console.log('⚙️  Reading settings...');
    const settings = await readSettings(selectedFolder);
    const spaceKey = settings.confluence.space;
    console.log(`✅ Space key: ${spaceKey}`);

    // Step 4: Read markdown files and folder structure from selected folder
    console.log('📄 Reading markdown files and folder structure...');
    const folderPath = path.join(process.cwd(), '..', 'md', selectedFolder);
    const { files, folders } = await readMarkdownFiles(folderPath);
    console.log(`✅ Found ${files.length} markdown file(s) and ${folders.length} folder(s)`);

    // Step 5: Prompt user to select which files to upsert
    const selectedFiles = await promptForFileSelection(files);
    if (selectedFiles.length === 0) {
      console.log('❌ No files selected. Exiting.');
      return;
    }
    console.log(`✅ Selected ${selectedFiles.length} file(s) to upsert`);

    // Step 6: Prompt for Confluence authentication
    console.log('\n🔐 Confluence Authentication');
    console.log(`✅ Using Confluence URL from settings: ${settings.confluence.url}`);
    const auth = await promptForAuth(settings.confluence.url);

    // Step 7: Create Confluence client and test connection
    console.log('\n🔗 Testing Confluence connection...');
    const confluenceClient = new ConfluenceClient(auth);
    const connectionSuccess = await confluenceClient.testConnection();

    // Step 8: Prompt user to continue
    const shouldContinue = await promptToContinue(connectionSuccess);
    if (!shouldContinue) {
      console.log('👋 Operation cancelled by user.');
      return;
    }

    // Step 9: Get parent page ID from settings (if available)
    const parentPageId = settings.confluence.pageId;
    if (parentPageId) {
      console.log(`✅ Parent page ID from settings: ${parentPageId}`);
    } else {
      console.log('✅ Creating pages at root level (no parent page ID in settings)');
    }

    // Step 10: Confirm upsert operation
    const confirmed = await confirmUpsert(selectedFolder, spaceKey, selectedFiles.length, folders.length);
    if (!confirmed) {
      console.log('👋 Operation cancelled by user.');
      return;
    }

    // Step 11: Perform upsert operations
    console.log('\n🔄 Starting upsert operations...');
    await upsertFolderToConfluence(confluenceClient, selectedFiles, folders, spaceKey, selectedFolder, parentPageId, settings);

    console.log('\n🎉 Upsert completed successfully!');

  } catch (error) {
    console.error('\n💥 Script failed:', error.message);
    
    // Offer retry option for certain errors
    if (error.message.includes('connection') || error.message.includes('authentication')) {
      const retry = await promptForRetry(error.message);
      if (retry) {
        console.log('\n🔄 Retrying...');
        await main();
        return;
      }
    }
    
    process.exit(1);
  }
}

/**
 * Upsert all files and folders to Confluence with proper hierarchy
 * @param {ConfluenceClient} confluenceClient - Confluence client instance
 * @param {Array} files - Array of file information objects
 * @param {Array} folders - Array of folder information objects
 * @param {string} spaceKey - Confluence space key
 * @param {string} folderName - Folder name for logging
 * @param {string|null} parentPageId - Optional parent page ID for root items
 * @param {Object} settings - Settings object containing pagePrefix
 */
async function upsertFolderToConfluence(confluenceClient, files, folders, spaceKey, folderName, parentPageId = null, settings = null) {
  const pageMap = new Map(); // Track created pages for parent-child relationships
  
  // Combine folders and files for topological sorting
  const allItems = [
    ...folders.map(folder => ({ ...folder, type: 'folder' })),
    ...files.map(file => ({ ...file, type: 'file' }))
  ];

  // Sort items topologically (folders before their children)
  const sortedItems = topologicalSort(allItems);
  
  let successCount = 0;
  let errorCount = 0;

  for (const item of sortedItems) {
    try {
      // Apply pagePrefix if available in settings
      const pagePrefix = settings?.confluence?.pagePrefix || '';
      const prefixedTitle = pagePrefix + item.title;
      
      console.log(`\n📝 Processing: ${prefixedTitle} (${item.type})`);

      let confluenceContent;
      let pageData;

      if (item.type === 'folder') {
        // Create folder page with minimal content
        confluenceContent = `<p>Folder: ${item.title}</p>`;
        pageData = {
          title: prefixedTitle,
          space: spaceKey,
          body: confluenceContent
        };
      } else {
        // Convert markdown to Confluence storage format for files
        confluenceContent = convertMarkdownToConfluenceStorage(item.content);
        pageData = {
          title: prefixedTitle,
          space: spaceKey,
          body: confluenceContent
        };
      }

      // Handle parent-child relationships
      if (item.parentPath && pageMap.has(item.parentPath)) {
        // Use internal folder hierarchy parent
        const parentPageId = pageMap.get(item.parentPath);
        pageData.ancestors = [parentPageId];
        console.log(`   📂 Parent: ${item.parentPath}`);
      } else if (parentPageId && !item.parentPath) {
        // Use external parent page ID for root items
        pageData.parentPageId = parentPageId;
        console.log(`   📂 External parent: ${parentPageId}`);
      }

      // Upsert page to Confluence
      const result = await confluenceClient.upsertPage(pageData);
      
      // Store page ID for potential child pages
      pageMap.set(item.relativePath, result.id);
      
      successCount++;
      console.log(`   ✅ Success: ${prefixedTitle}`);

    } catch (error) {
      errorCount++;
      console.error(`   ❌ Failed to upsert "${prefixedTitle}":`, error.message);
      
      // Continue with next item even if one fails
      continue;
    }
  }

  // Summary
  console.log('\n📊 Upsert Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   📁 Total: ${allItems.length} (${folders.length} folders, ${files.length} files)`);

  if (errorCount > 0) {
    throw new Error(`${errorCount} item(s) failed to upsert`);
  }
}

/**
 * Topologically sort items to ensure parents are processed before children
 * @param {Array} items - Array of items with parentPath and relativePath
 * @returns {Array} Topologically sorted array
 */
function topologicalSort(items) {
  const graph = new Map();
  const inDegree = new Map();
  const itemMap = new Map();

  // Initialize data structures
  for (const item of items) {
    itemMap.set(item.relativePath, item);
    graph.set(item.relativePath, []);
    inDegree.set(item.relativePath, 0);
  }

  // Build dependency graph
  for (const item of items) {
    if (item.parentPath && itemMap.has(item.parentPath)) {
      graph.get(item.parentPath).push(item.relativePath);
      inDegree.set(item.relativePath, inDegree.get(item.relativePath) + 1);
    }
  }

  // Find items with no dependencies (root items)
  const queue = [];
  for (const [path, degree] of inDegree) {
    if (degree === 0) {
      queue.push(path);
    }
  }

  // Perform topological sort
  const sorted = [];
  while (queue.length > 0) {
    const currentPath = queue.shift();
    sorted.push(itemMap.get(currentPath));

    for (const dependent of graph.get(currentPath)) {
      inDegree.set(dependent, inDegree.get(dependent) - 1);
      if (inDegree.get(dependent) === 0) {
        queue.push(dependent);
      }
    }
  }

  // Check for cycles (shouldn't happen in file system structure)
  if (sorted.length !== items.length) {
    console.warn('⚠️  Warning: Possible cycle detected in folder structure');
      // Fallback to original order
      return [...items].sort((a, b) => {
        const aDepth = (a.relativePath.split(path.sep) || []).length;
        const bDepth = (b.relativePath.split(path.sep) || []).length;
        return aDepth - bDepth;
      });
  }

  return sorted;
}

/**
 * Handle script termination
 */
process.on('SIGINT', () => {
  console.log('\n👋 Script terminated by user.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Script terminated.');
  process.exit(0);
});

// Run the main function
main().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
