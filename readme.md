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

## Install

```bash
# Clone the repository
git clone https://github.com/yourusername/mongodb-tui.git
cd mongodb-tui

# Install dependencies
npm install

# Build the application
npm run build

# Link the package globally (optional)
npm link
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
- `s`: Enter search mode
- `o`: Toggle sort order (ascending/descending)
- `e`: Edit selected field of the selected document
- `f`: Go to first page
- `l`: Go to last page
- `[`: Scroll to first columns
- `]`: Scroll to last columns
- `ESC`: Go back to previous view or cancel current operation

## Development

```bash
# Watch for changes and rebuild
npm run dev

# In another terminal, run the app
node dist/cli.js
```

## License

MIT
