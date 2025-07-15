import * as XLSX from 'xlsx';

export function exportToExcel(state) {
  const data = [];
  
  // Add problem statement as first row
  data.push({
    Category: 'PROBLEM STATEMENT',
    Cause: state.problemStatement,
    Subcause: '',
    Comments: '',
    X: 800,
    Y: 250,
  });

  // Add categories, causes, and subcauses
  state.categories.forEach(category => {
    // Add category row
    data.push({
      Category: category.name,
      Cause: '',
      Subcause: '',
      Comments: '',
      X: category.x,
      Y: category.y,
    });

    // Add causes
    category.causes.forEach(cause => {
      data.push({
        Category: category.name,
        Cause: cause.name,
        Subcause: '',
        Comments: cause.comment || '',
        X: cause.x,
        Y: cause.y,
      });

      // Add subcauses
      cause.subcauses.forEach(subcause => {
        data.push({
          Category: category.name,
          Cause: cause.name,
          Subcause: subcause.name,
          Comments: subcause.comment || '',
          X: subcause.x,
          Y: subcause.y,
        });
      });
    });
  });

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Fishbone Diagram');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `fishbone-diagram-${timestamp}.xlsx`;

  // Save file
  XLSX.writeFile(wb, filename);
}

export async function importFromExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Parse the data
        const parsedData = parseExcelData(jsonData);
        resolve(parsedData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

function parseExcelData(jsonData) {
  const categories = new Map();
  let problemStatement = 'Problem Statement';

  jsonData.forEach(row => {
    // Check for problem statement
    if (row.Category === 'PROBLEM STATEMENT') {
      problemStatement = row.Cause || 'Problem Statement';
      return;
    }

    // Skip empty rows
    if (!row.Category) return;

    const categoryName = row.Category;
    const causeName = row.Cause;
    const subcauseName = row.Subcause;
    const comments = row.Comments || '';
    const x = parseFloat(row.X) || 0;
    const y = parseFloat(row.Y) || 0;

    // Initialize category if it doesn't exist
    if (!categories.has(categoryName)) {
      categories.set(categoryName, {
        id: generateId(),
        name: categoryName,
        x: x,
        y: y,
        causes: [],
      });
    }

    const category = categories.get(categoryName);

    // If there's a cause name, handle cause/subcause
    if (causeName) {
      // Find or create cause
      let cause = category.causes.find(c => c.name === causeName);
      if (!cause) {
        cause = {
          id: generateId(),
          name: causeName,
          x: x,
          y: y,
          comment: subcauseName ? '' : comments,
          subcauses: [],
        };
        category.causes.push(cause);
      }

      // If there's a subcause name, add it
      if (subcauseName) {
        const subcause = {
          id: generateId(),
          name: subcauseName,
          x: x,
          y: y,
          comment: comments,
        };
        cause.subcauses.push(subcause);
      } else if (comments && !cause.comment) {
        cause.comment = comments;
      }
    }
  });

  return {
    problemStatement,
    categories: Array.from(categories.values()),
    selectedNode: null,
    dragMode: false,
  };
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
} 