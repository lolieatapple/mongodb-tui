# MongoDB TUI

A terminal-based user interface for MongoDB built with [Ink](https://github.com/vadimdemedes/ink).

## Features

- Connect to MongoDB instances (local or remote)
- Browse databases and collections
- View documents in a tabular format with pagination
- Sort documents in ascending or descending order
- Search documents by field values
- Edit document fields
- Navigate using keyboard shortcuts
- Horizontal scrolling to view all document fields

## Installation

```bash
# Install globally from npm
npm install -g mongodb-tui

# Or using yarn
yarn global add mongodb-tui
```

### Troubleshooting

If you installed with `yarn global add` but the `mongodb-tui` command is not found, you may need to add yarn's global bin directory to your PATH:

```bash
# Add yarn global bin to PATH
echo 'export PATH="$(yarn global bin):$PATH"' >> ~/.bashrc
source ~/.bashrc

# For zsh users
echo 'export PATH="$(yarn global bin):$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## Usage

```bash
# Run with default connection (mongodb://localhost:27017)
mongodb-tui

# Connect to a specific MongoDB instance
mongodb-tui --url=mongodb://username:password@hostname:port/database
```

## Keyboard Shortcuts

### In Document View
- `↑` / `↓`: Navigate between document rows
- `←` / `→`: Navigate between document fields (columns)
- `Page Up` / `Page Down`: Navigate between pages
- `Enter`: View detailed content of the selected field
- `s`: Enter search mode
- `o`: Toggle sort order (ascending/descending)
- `e`: Edit selected field of the selected document
- `f`: Go to first page
- `l`: Go to last page
- `[`: Scroll to first columns
- `]`: Scroll to last columns
- `ESC`: Go back to previous view or cancel current operation

## Development

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/yourusername/mongodb-tui.git
cd mongodb-tui

# Install dependencies
npm install

# Watch for changes and rebuild
npm run dev

# In another terminal, run the app
node dist/cli.js
```

### Publishing to npm

```bash
# Update version in package.json (patch, minor, or major)
npm version patch

# Build the application
npm run build

# Login to npm
npm login

# Publish the package
npm publish

# Or publish with a specific tag
npm publish --tag beta
```

Make sure to update the version number in `package.json` before publishing a new version. You can use `npm version patch`, `npm version minor`, or `npm version major` to automatically increment the version number according to [semantic versioning](https://semver.org/) principles.

## License

MIT
