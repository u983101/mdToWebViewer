# Confluence Markdown Upsert Script

A Node.js script that allows you to upsert markdown files from local subfolders to Confluence spaces with interactive prompts.

## Features

- Interactive subfolder selection
- Secure authentication
- Markdown to Confluence conversion
- Upsert operations (create or update)
- Hierarchical structure support
- File selection options
- Comprehensive error handling

## Prerequisites

- Node.js 14.0.0 or higher
- Confluence account with permissions
- Markdown files in subfolders under `md/`

## Installation

```bash
cd scripts
npm install
```

## Configuration

Each subfolder needs a `settings.json` file:

```json
{
  "confluence": {
    "space": "YOUR_SPACE_KEY"
  }
}
```

## Usage

```bash
cd scripts
npm start
```

## Authentication

- Base URL (e.g., `https://your-domain.atlassian.net`)
- Username or email
- Password or API token (recommended)

## File Processing

- Titles extracted from markdown headings
- Hierarchical structure maintained
- Parent-child relationships preserved

## Error Handling

- Connection errors with retry options
- Authentication validation
- Individual file failures don't stop process
- Detailed logging and progress indicators

## Security

- Credentials stored only in memory
- API tokens recommended
- No persistent credential storage
