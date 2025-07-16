# Fishbone Diagram Tool

A modern, interactive fishbone diagram (Ishikawa diagram) tool built with React and Material Design 3. Create, edit, and export professional fishbone diagrams with intuitive drag-and-drop functionality.

![Fishbone Diagram Tool](https://img.shields.io/badge/React-18-blue) ![Material-UI](https://img.shields.io/badge/Material--UI-v5-orange) ![License](https://img.shields.io/badge/License-MIT-green)

## 🌟 Features

### ✨ **Interactive SVG Canvas**
- Create and manipulate fishbone diagrams with intuitive drag-and-drop functionality
- **Moveable spine connection points** - Each category has its own adjustable connection point on the main spine
- Real-time visual feedback and smooth interactions
- Optimized performance for large diagrams

### 🎨 **Modern Design**
- **Material Design 3** with updated color scheme:
  - 🟠 **Orange** for categories
  - ⚫ **Gray** for causes  
  - 🔵 **Light Blue** for subcauses
- Clean, professional interface with consistent styling
- Responsive design that works on different screen sizes

### 🏗️ **Hierarchical Structure**
- **Categories** → **Causes** → **Subcauses** with clear visual connections
- **Template System**: Start with the 6 typical fishbone categories:
  - People, Process, Materials, Machines, Measurements, Environment
- Add unlimited levels of detail to your analysis

### 🛠️ **Enhanced Hover Interactions**
- **Improved hover toolbar** that stays open when you hover over it
- Edit names, add comments, delete nodes, and add subnodes with icon-based toolbar
- **200ms delay** prevents accidental toolbar hiding
- Visual comment indicators with orange dots

### 📊 **Excel Import/Export**
- Save diagrams to Excel with **coordinate preservation** for exact recreation
- **Enhanced format** includes SpineX coordinates for moveable connection points
- Import existing diagrams and maintain all positioning
- Perfect for collaboration and version control

### 🎯 **Smart Template System**
- **Optimized default coordinates** for better visual layout
- Pre-positioned categories for immediate professional appearance
- Customizable starting points for different industries

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn
- Modern web browser with ES6+ support

### Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Deploy to GitHub Pages:**
   ```bash
   npm run deploy
   ```

## 📖 Usage Guide

### 🎮 **Sidebar Controls**

#### Main Actions
- **🆕 Create New Fishbone Diagram**: Clears the canvas for a fresh start
- **⭐ Start with Template**: Loads the 6 optimized categories with perfect positioning
- **➕ Create New Category**: Adds a new category node to the diagram

#### Data Management
- **📥 Export to Spreadsheet**: Downloads current diagram as Excel file with coordinates
- **📤 Load from Spreadsheet**: Imports diagram from Excel file with position preservation

#### Live Statistics
- Real-time count of categories, causes, and subcauses
- Color-coded chips matching the diagram elements

### 🖱️ **Node Interactions**

**Hover over any node** (category, cause, or subcause) to reveal the **enhanced action toolbar**:

- **✏️ Edit**: Change the node's name
- **💬 Comment**: Add or edit comments (shows orange indicator dot)
- **➕ Add**: Add a subnode (causes to categories, subcauses to causes)
- **⋮⋮ Drag**: Drag to reposition the node anywhere on canvas
- **🗑️ Delete**: Remove the node and all its children

### 🔗 **Spine Connection Points**

- **🟠 Orange circles** on the main spine represent individual category connection points
- **Drag horizontally** to adjust where each category line connects to the spine
- **Automatic constraints** prevent invalid positioning
- **Exported coordinates** preserve your custom layout

### 📝 **Problem Statement**

Click on the **orange box** at the end of the fishbone spine to edit the main problem statement that drives your analysis.

### 📊 **Excel Integration**

#### Export Format
| Column | Description | Example |
|--------|-------------|---------|
| **Category** | Main category name | "People" |
| **Cause** | Cause under category | "Lack of training" |
| **Subcause** | Subcause under cause | "No onboarding program" |
| **Comments** | Additional notes | "Priority: High" |
| **X, Y** | Node coordinates | 190, 181 |
| **SpineX** | Spine connection point | 250 |

#### Import Requirements
- Excel files (.xlsx, .xls)
- Headers: Category, Cause, Subcause, Comments, X, Y, SpineX
- PROBLEM row for main problem statement

## 🏢 **Chrome Extension Ready**

This project is architected for easy conversion to a Chrome extension:
- Self-contained React build output
- Minimal external dependencies
- CSP-compliant code structure
- Simply add `manifest.json` and adjust security policies

## 🛠️ **Technology Stack**

- **⚛️ React 18** - Modern frontend framework with hooks
- **🎨 Material-UI v5** - Material Design 3 components and theming
- **🖼️ SVG** - Scalable vector graphics for crisp diagram rendering
- **📊 xlsx** - Excel file import/export functionality
- **🆔 UUID** - Unique identifier generation for all elements
- **🎯 GitHub Pages** - Seamless deployment and hosting

## 🔧 **Recent Improvements**

### **Enhanced User Experience**
- ✅ **Persistent hover toolbar** - No more disappearing before you can click!
- ✅ **Updated color scheme** - Professional orange/gray/blue palette
- ✅ **Moveable spine connections** - Individual control over category line positions
- ✅ **Optimized template coordinates** - Better default positioning for immediate use

### **Technical Enhancements**
- ✅ **200ms hover delays** for better UX
- ✅ **SpineX coordinate system** for flexible layouts  
- ✅ **Memory leak prevention** with proper cleanup
- ✅ **Enhanced Excel format** with coordinate preservation

## 📄 **License**

This project is licensed under the **MIT License** - see the LICENSE file for details.

## 🎯 **Perfect For**

- **Quality Management** - Root cause analysis and problem solving
- **Process Improvement** - Identifying bottlenecks and inefficiencies  
- **Team Collaboration** - Visual brainstorming and analysis
- **Education** - Teaching cause-and-effect relationships
- **Consulting** - Professional client presentations

## 🌐 **Live Demo**

Try the tool live at: **[https://autogusx.github.io/FishboneDiagramReact/](https://autogusx.github.io/FishboneDiagramReact/)**

---

**Built with ❤️ for better problem-solving and root cause analysis** 