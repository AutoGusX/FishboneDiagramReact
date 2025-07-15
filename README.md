# Fishbone Diagram Tool

A modern, interactive fishbone diagram (Ishikawa diagram) tool built with React and Material Design 3.

## Features

- **Interactive SVG Canvas**: Create and manipulate fishbone diagrams with intuitive drag-and-drop functionality
- **Template System**: Start with the 6 typical fishbone categories (People, Process, Materials, Machines, Measurements, Environment)
- **Hierarchical Structure**: Categories → Causes → Subcauses with visual connections
- **Hover Interactions**: Edit names, add comments, delete nodes, and add subnodes with icon-based toolbar
- **Excel Import/Export**: Save diagrams to Excel with coordinate preservation for exact recreation
- **Material Design 3**: Modern, clean interface with consistent styling
- **Responsive Design**: Works on different screen sizes

## Getting Started

### Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Building for Production

1. Build the app for production:
   ```bash
   npm run build
   ```

2. The build files will be in the `build` folder, ready for deployment.

### GitHub Pages Deployment

1. Update the `homepage` field in `package.json` with your GitHub Pages URL
2. Deploy to GitHub Pages:
   ```bash
   npm run deploy
   ```

## Usage

### Sidebar Controls

- **Create New Fishbone Diagram**: Clears the canvas for a fresh start
- **Start with Template**: Loads the 6 typical fishbone categories
- **Create New Category**: Adds a new category node to the diagram
- **Export to Spreadsheet**: Downloads current diagram as Excel file
- **Load from Spreadsheet**: Imports diagram from Excel file

### Node Interactions

Hover over any node (category, cause, or subcause) to reveal action icons:

- **Edit (✏️)**: Change the node's name
- **Comment (💬)**: Add or edit comments (indicated by orange dot)
- **Add (+)**: Add a subnode (causes to categories, subcauses to causes)
- **Drag (⋮⋮)**: Drag to reposition the node
- **Delete (🗑️)**: Remove the node and its children

### Problem Statement

Click on the blue box at the end of the fishbone spine to edit the main problem statement.

### Excel Format

When exporting to Excel, the format is:
- **Category**: The main category name
- **Cause**: The cause under that category
- **Subcause**: The subcause under that cause
- **Comments**: Any comments added to the node
- **X, Y**: Coordinates for exact positioning

## Chrome Extension Compatibility

This project is designed to be easily convertible to a Chrome extension. The React build output can be adapted with minimal changes by adding a `manifest.json` file and adjusting Content Security Policy if needed.

## Technology Stack

- **React 18** - Frontend framework
- **Material-UI v5** - Material Design 3 components
- **SVG** - Diagram rendering
- **xlsx** - Excel import/export functionality
- **UUID** - Unique identifier generation

## License

This project is licensed under the MIT License. 