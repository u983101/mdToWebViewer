import inquirer from 'inquirer';

/**
 * Interactive prompt utilities for user interaction
 */

/**
 * Prompt user to select a subfolder
 * @param {string[]} subfolders - Array of subfolder names
 * @returns {Promise<string>} Selected subfolder name
 */
export async function promptForSubfolder(subfolders) {
  if (subfolders.length === 0) {
    throw new Error('No subfolders found in md/ directory');
  }

  const { selectedFolder } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedFolder',
      message: 'Which subfolder would you like to upsert to Confluence?',
      choices: subfolders,
      pageSize: 10
    }
  ]);

  return selectedFolder;
}

/**
 * Prompt user for Confluence authentication details
 * @param {string} baseUrl - Confluence base URL from settings
 * @returns {Promise<Object>} Authentication object
 */
export async function promptForAuth(baseUrl) {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'username',
      message: 'Confluence username or email:',
      validate: (input) => {
        if (!input) {
          return 'Please enter your Confluence username or email';
        }
        return true;
      }
    },
    {
      type: 'password',
      name: 'password',
      message: 'Confluence password or API token:',
      mask: '*',
      validate: (input) => {
        if (!input) {
          return 'Please enter your Confluence password or API token';
        }
        return true;
      }
    },
    {
      type: 'confirm',
      name: 'ignoreSSL',
      message: 'Ignore SSL certificate errors (for self-signed certificates)?',
      default: false
    }
  ]);

  return {
    baseUrl: baseUrl,
    username: answers.username,
    password: answers.password,
    ignoreSSL: answers.ignoreSSL
  };
}

/**
 * Confirm upsert operation before starting
 * @param {string} folderName - Selected folder name
 * @param {string} spaceKey - Confluence space key
 * @param {number} fileCount - Number of files to upsert
 * @param {number} folderCount - Number of folders to create
 * @returns {Promise<boolean>} True if user confirms
 */
export async function confirmUpsert(folderName, spaceKey, fileCount, folderCount) {
  const totalItems = fileCount + folderCount;
  const message = folderCount > 0 
    ? `Are you sure you want to upsert ${totalItems} items (${fileCount} files, ${folderCount} folders) from "${folderName}" to Confluence space "${spaceKey}"?`
    : `Are you sure you want to upsert ${fileCount} files from "${folderName}" to Confluence space "${spaceKey}"?`;

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: message,
      default: false
    }
  ]);

  return confirm;
}

/**
 * Prompt user to continue after connection test
 * @param {boolean} connectionSuccess - Whether connection test was successful
 * @returns {Promise<boolean>} True if user wants to continue
 */
export async function promptToContinue(connectionSuccess) {
  if (!connectionSuccess) {
    const { continueAnyway } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continueAnyway',
        message: 'Connection test failed. Do you want to continue anyway?',
        default: false
      }
    ]);
    return continueAnyway;
  }

  const { continueUpsert } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'continueUpsert',
      message: 'Connection successful! Do you want to proceed with the upsert?',
      default: true
    }
  ]);

  return continueUpsert;
}

/**
 * Prompt user for retry on error
 * @param {string} errorMessage - Error message to display
 * @returns {Promise<boolean>} True if user wants to retry
 */
export async function promptForRetry(errorMessage) {
  console.error(`\n❌ Error: ${errorMessage}`);
  
  const { retry } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'retry',
      message: 'Would you like to retry?',
      default: false
    }
  ]);

  return retry;
}

/**
 * Prompt user to select which files to upsert
 * @param {Array} files - Array of file information objects
 * @returns {Promise<Array>} Selected files to upsert
 */
export async function promptForFileSelection(files) {
  if (files.length === 0) {
    throw new Error('No markdown files found in selected folder');
  }

  // Filter out README.md files from the selection
  const filteredFiles = files.filter(file => {
    const fileName = file.relativePath.split('/').pop();
    return fileName !== 'README.md';
  });

  if (filteredFiles.length === 0) {
    throw new Error('No markdown files found after filtering README.md files');
  }

  const { selectedFiles } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedFiles',
      message: 'Select files to upsert (use space to select, enter to confirm):',
      choices: filteredFiles.map(file => ({
        name: `${file.title} (${file.relativePath})`,
        value: file,
        checked: true
      })),
      pageSize: 15
    }
  ]);

  return selectedFiles;
}
