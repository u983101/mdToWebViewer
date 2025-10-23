# Markdown Documentation System

This system provides a comprehensive solution for managing markdown documentation with web viewing capabilities and Confluence integration.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Using Markdown Files](#using-markdown-files)
- [Web Viewer](#web-viewer)
- [Confluence Integration](#confluence-integration)
- [Settings Configuration](#settings-configuration)
- [Getting Started](#getting-started)

## Overview

This system allows you to:
- Organize markdown documentation in a hierarchical structure
- View documentation through a web interface with navigation
- Upload documentation to Confluence automatically
- Maintain project-specific configurations

## Project Structure

```
md/
├── README.md                 # This file
├── index.md                  # Main project index
├── settings.json             # Global settings
└── sample-sdlc-project/      # Sample SDLC project
    ├── settings.json         # Project-specific settings
    ├── index.md
    ├── project-charter.md
    ├── business-requirements.md
    ├── stakeholder-analysis.md
    ├── functional-requirements.md
    ├── technical-design.md
    ├── development-plan.md
    ├── test-strategy.md
    ├── deployment-plan.md
    ├── user-stories.md
    ├── user-stories/
    │   ├── index.md
    │   ├── us-001-user-registration.md
    │   ├── us-002-user-login.md
    │   ├── us-004-browse-products.md
    │   ├── us-007-add-to-cart.md
    │   └── us-015-manage-products.md
    └── hello.md
```

## Using Markdown Files

### File Organization

- Each project should be in its own subfolder under `md/`
- Use `index.md` files to create navigation and overview pages
- Maintain hierarchical structure with subfolders for better organization
- File names should be descriptive and use kebab-case (e.g., `project-charter.md`)

### Markdown Features Supported

The system supports standard markdown syntax including:
- Headers (`#`, `##`, `###`, etc.)
- Lists (ordered and unordered)
- Links (`[text](url)`)
- Code blocks with syntax highlighting
- Tables
- Images
- Bold and italic text

### Navigation Structure

The web viewer automatically generates navigation based on:
- Folder structure hierarchy
- `index.md` files as navigation nodes
- File names as page titles

## Web Viewer

### Starting the Web Server

```bash
# From the project root
npm start
```

The server will start on `http://localhost:3000` by default.

### Features

- **Automatic Navigation**: Sidebar navigation generated from folder structure
- **Live Preview**: Real-time markdown rendering
- **Responsive Design**: Works on desktop and mobile devices
- **Search Functionality**: Built-in search for content
- **Breadcrumb Navigation**: Easy navigation through folder hierarchy

### Accessing Documentation

- Navigate to `http://localhost:3000` to see the main index
- Click on project folders to explore documentation
- Use the sidebar navigation to jump between pages

## Confluence Integration

### Overview

The system includes scripts to upload markdown documentation to Confluence, maintaining the hierarchical structure and converting markdown to Confluence storage format.

### Prerequisites

- Node.js 14.0.0 or higher
- Confluence account with appropriate permissions
- API token or username/password for authentication

### Setup

1. **Install dependencies**:
   ```bash
   cd scripts
   npm install
   ```

2. **Configure project settings** (see [Settings Configuration](#settings-configuration))

### Uploading to Confluence

1. **Run the upload script**:
   ```bash
   cd scripts
   npm start
   ```

2. **Follow the interactive prompts**:
   - Select the project folder to upload
   - Choose which files to upload
   - Provide Confluence authentication
   - Confirm the upload operation

### Features

- **Interactive Selection**: Choose which files and folders to upload
- **Hierarchical Preservation**: Maintains folder structure in Confluence
- **Upsert Operations**: Creates new pages or updates existing ones
- **Error Handling**: Continues processing even if individual files fail
- **Progress Tracking**: Real-time progress indicators
- **Retry Options**: Automatic retry for connection issues

### Authentication Options

- **API Token** (Recommended): More secure, doesn't require password
- **Username/Password**: Traditional authentication method

## Settings Configuration

### Global Settings (`md/settings.json`)

Located in the root `md/` folder, this file contains global configuration:

```json
{
    "github": {
        "url": "https://github.com/u983101/mdToWebViewer"
    },
    "deployment": {
        "url": "http://www.google.com"
    }
}
```

### Project-Specific Settings

Each project folder can have its own `settings.json` file for Confluence integration:

```json
{
    "confluence": {
        "space": "SAM",                    // Confluence space key
        "pageId": "950318",                // Optional parent page ID
        "url": "http://localhost:8090",    // Confluence instance URL
        "pagePrefix": "SDLC-"              // Prefix for page titles
    },
    "jira": {
        "projectKey": "SDLC",              // Jira project key
        "label": "connectoTeam4"           // Jira label
    }
}
```

### Settings Parameters

#### Confluence Settings

- **space** (required): The Confluence space key where pages will be created
- **url** (required): Base URL of your Confluence instance
- **pageId** (optional): Parent page ID for hierarchical organization
- **pagePrefix** (optional): Prefix added to all page titles

#### Jira Settings (Optional)

- **projectKey**: Associated Jira project key
- **label**: Default label for Jira integration

## Getting Started

### 1. Create a New Project

1. Create a new folder under `md/` (e.g., `md/my-new-project/`)
2. Add an `index.md` file with project overview
3. Create additional markdown files as needed
4. (Optional) Add a `settings.json` file for Confluence configuration

### 2. View Documentation Locally

```bash
npm start
# Open http://localhost:3000 in your browser
```

### 3. Upload to Confluence (Optional)

```bash
cd scripts
npm start
# Follow the interactive prompts
```

### 4. Best Practices

- **Consistent Naming**: Use descriptive, kebab-case file names
- **Hierarchical Organization**: Use subfolders for logical grouping
- **Index Files**: Include `index.md` in each folder for navigation
- **Regular Updates**: Keep documentation current with project changes
- **Backup**: Use version control (Git) to track documentation changes

## Troubleshooting

### Common Issues

1. **Web Server Not Starting**
   - Check if port 3000 is available
   - Verify Node.js is installed (`node --version`)
   - Ensure dependencies are installed (`npm install`)

2. **Confluence Upload Fails**
   - Verify Confluence URL and credentials
   - Check if the space key exists and you have permissions
   - Ensure the project has a valid `settings.json` file

3. **Navigation Not Working**
   - Verify folder structure follows the expected pattern
   - Check that `index.md` files exist in each folder
   - Ensure markdown files have proper headers

### Getting Help

- Check the scripts documentation in `scripts/README.md`
- Review error messages in the console
- Verify configuration settings in `settings.json` files

## License

This project is licensed under the MIT License - see the LICENSE file for details.
