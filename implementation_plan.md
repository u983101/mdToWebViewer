# Implementation Plan

Create a Confluence upsert script that synchronizes markdown files from subfolders to Confluence spaces, with interactive user prompts for subfolder selection and authentication.

This implementation will create a robust Node.js script that allows users to upsert markdown files to Confluence spaces. The script will read configuration from settings.json files in subfolders, prompt users for authentication details, and handle page creation/updates with proper hierarchy management. This addresses the need for automated documentation synchronization between local markdown files and Confluence.

[Types]  
Define TypeScript interfaces for configuration, authentication, and Confluence API responses.

```typescript
interface ConfluenceSettings {
  baseUrl?: string;
  space: string;
}

interface SubfolderSettings {
  confluence: ConfluenceSettings;
  jira?: {
    projectKey: string;
    label: string;
  };
}

interface ConfluenceAuth {
  username: string;
  password: string;
  baseUrl: string;
}

interface ConfluencePage {
  id?: string;
  title: string;
  space: {
    key: string;
  };
  body: {
    storage: {
      value: string;
      representation: "storage";
    };
  };
  type: "page";
  version?: {
    number: number;
  };
  ancestors?: Array<{
    id: string;
  }>;
}

interface FileInfo {
  path: string;
  relativePath: string;
  content: string;
  title: string;
  parentPath?: string;
}
```

[Files]
Create new scripts directory with main script and supporting utilities.

Detailed breakdown:
- New files to be created:
  - `scripts/confluence-upsert.js` - Main script with interactive prompts and upsert logic
  - `scripts/utils/confluence-client.js` - Confluence API client with authentication and CRUD operations
  - `scripts/utils/file-utils.js` - File system utilities for reading markdown files and directory structure
  - `scripts/utils/prompt-utils.js` - Interactive prompt utilities for user input
  - `scripts/package.json` - Node.js dependencies for the script

- Existing files to be modified:
  - None (this is a standalone script that doesn't modify existing code)

- Files to be deleted or moved:
  - None

- Configuration file updates:
  - Subfolder `settings.json` files can optionally include `baseUrl` for Confluence server

[Functions]
Implement functions for Confluence API interaction, file processing, and user interaction.

Detailed breakdown:
- New functions in `scripts/confluence-upsert.js`:
  - `main()` - Entry point with subfolder selection and authentication prompts
  - `selectSubfolder()` - Interactive selection of subfolder to upsert
  - `promptForAuth()` - Collect Confluence authentication details
  - `upsertFolderToConfluence()` - Main upsert logic for selected folder

- New functions in `scripts/utils/confluence-client.js`:
  - `ConfluenceClient` class with constructor for authentication
  - `getPageByTitle(spaceKey, title)` - Find existing page by title
  - `createPage(pageData)` - Create new Confluence page
  - `updatePage(pageId, pageData)` - Update existing Confluence page
  - `searchPages(spaceKey, title)` - Search for pages in space

- New functions in `scripts/utils/file-utils.js`:
  - `getSubfolders()` - List available subfolders in md directory
  - `readSettings(folderPath)` - Read settings.json from subfolder
  - `readMarkdownFiles(folderPath)` - Recursively read all markdown files
  - `convertMarkdownToConfluenceStorage(markdown)` - Convert markdown to Confluence storage format

- New functions in `scripts/utils/prompt-utils.js`:
  - `promptForSubfolder(subfolders)` - Interactive subfolder selection
  - `promptForAuth()` - Collect username, password, and base URL
  - `confirmUpsert(folder, space)` - Confirmation before starting upsert

- Modified functions:
  - None (new implementation)

- Removed functions:
  - None

[Classes]
Create a ConfluenceClient class to encapsulate API interactions.

Detailed breakdown:
- New classes in `scripts/utils/confluence-client.js`:
  - `ConfluenceClient` - Main class for Confluence API operations
    - Constructor: `constructor(auth)` - Initialize with authentication
    - Methods: `getPageByTitle()`, `createPage()`, `updatePage()`, `searchPages()`
    - Properties: `baseUrl`, `auth`

- Modified classes:
  - None

- Removed classes:
  - None

[Dependencies]
Add Node.js dependencies for HTTP requests, file system operations, and user prompts.

Details of new packages, version changes, and integration requirements:
- Required dependencies (to be added to `scripts/package.json`):
  - `axios@^1.6.0` - HTTP client for Confluence API calls
  - `inquirer@^8.2.6` - Interactive command line prompts
  - `marked@^9.0.0` - Markdown to HTML conversion (already in main project)
  - `fs-extra@^11.1.1` - Enhanced file system operations

- Integration requirements:
  - Node.js version >= 14.0.0
  - Access to Confluence REST API
  - Read access to md/ directory structure

[Testing]
Implement basic validation and error handling with comprehensive logging.

Test file requirements, existing test modifications, and validation strategies:
- Testing approach:
  - No formal test files initially (script will be manually tested)
  - Comprehensive error handling and logging
  - Validation of Confluence API responses
  - File system operation error handling

- Validation strategies:
  - Check Confluence connectivity before starting
  - Validate markdown file readability
  - Verify settings.json structure
  - Handle Confluence API rate limiting and errors

[Implementation Order]
Follow logical sequence from directory setup to script implementation.

Numbered steps showing the logical order of changes to minimize conflicts and ensure successful integration:
1. Create scripts directory structure
2. Implement package.json with dependencies
3. Create file utilities for reading markdown files and settings
4. Implement Confluence API client with authentication
5. Create prompt utilities for user interaction
6. Implement main upsert script with subfolder selection
7. Add error handling and logging throughout
8. Test script with sample markdown files
9. Document script usage and configuration
