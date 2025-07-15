import React, { useRef } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Divider,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Dashboard as TemplateIcon,
  Clear as ClearIcon,
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
} from '@mui/icons-material';
import { useFishboneData } from '../hooks/useFishboneData';
import { exportToExcel, importFromExcel } from '../utils/excelUtils';

function Sidebar() {
  const { state, dispatch } = useFishboneData();
  const fileInputRef = useRef(null);

  const handleClearDiagram = () => {
    dispatch({ type: 'CLEAR_DIAGRAM' });
  };

  const handleLoadTemplate = () => {
    dispatch({ type: 'LOAD_TEMPLATE' });
  };

  const handleAddCategory = () => {
    dispatch({ type: 'ADD_CATEGORY' });
  };

  const handleExportToExcel = () => {
    exportToExcel(state);
  };

  const handleImportFromExcel = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const data = await importFromExcel(file);
        dispatch({ type: 'LOAD_FROM_DATA', payload: data });
      } catch (error) {
        console.error('Error importing file:', error);
        alert('Error importing file. Please check the format and try again.');
      }
    }
    // Reset file input
    event.target.value = '';
  };

  return (
    <Paper
      elevation={2}
      sx={{
        width: 280,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        p: 3,
        backgroundColor: 'background.paper',
        borderRadius: 0,
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
        Fishbone Diagram
      </Typography>

      <Stack spacing={2}>
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 500, color: 'text.secondary' }}>
          Diagram Actions
        </Typography>

        <Tooltip title="Start with a blank fishbone diagram" placement="right">
          <Button
            variant="contained"
            startIcon={<ClearIcon />}
            onClick={handleClearDiagram}
            fullWidth
            sx={{
              py: 1.5,
              justifyContent: 'flex-start',
              textAlign: 'left',
            }}
          >
            Create New Fishbone Diagram
          </Button>
        </Tooltip>

        <Tooltip title="Load the 6 typical fishbone categories" placement="right">
          <Button
            variant="outlined"
            startIcon={<TemplateIcon />}
            onClick={handleLoadTemplate}
            fullWidth
            sx={{
              py: 1.5,
              justifyContent: 'flex-start',
              textAlign: 'left',
            }}
          >
            Start with Template
          </Button>
        </Tooltip>

        <Tooltip title="Add a new category to the diagram" placement="right">
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddCategory}
            fullWidth
            sx={{
              py: 1.5,
              justifyContent: 'flex-start',
              textAlign: 'left',
            }}
          >
            Create New Category
          </Button>
        </Tooltip>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 500, color: 'text.secondary' }}>
          Data Management
        </Typography>

        <Tooltip title="Export diagram data to Excel spreadsheet" placement="right">
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportToExcel}
            fullWidth
            sx={{
              py: 1.5,
              justifyContent: 'flex-start',
              textAlign: 'left',
            }}
          >
            Export to Spreadsheet
          </Button>
        </Tooltip>

        <Tooltip title="Load diagram data from Excel spreadsheet" placement="right">
          <Button
            variant="outlined"
            startIcon={<ImportIcon />}
            onClick={handleImportFromExcel}
            fullWidth
            sx={{
              py: 1.5,
              justifyContent: 'flex-start',
              textAlign: 'left',
            }}
          >
            Load from Spreadsheet
          </Button>
        </Tooltip>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
        />
      </Stack>

      <Box sx={{ mt: 'auto', p: 2, backgroundColor: 'primary.main', borderRadius: 2 }}>
        <Typography variant="body2" sx={{ color: 'white', textAlign: 'center' }}>
          <strong>Categories:</strong> {state.categories.length}
        </Typography>
        <Typography variant="body2" sx={{ color: 'white', textAlign: 'center', mt: 0.5 }}>
          <strong>Total Causes:</strong>{' '}
          {state.categories.reduce((total, cat) => total + cat.causes.length, 0)}
        </Typography>
      </Box>
    </Paper>
  );
}

export default Sidebar; 