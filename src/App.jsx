import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import Sidebar from './components/Sidebar';
import FishboneCanvas from './components/FishboneCanvas';
import { FishboneProvider } from './hooks/useFishboneData';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6750A4',
    },
    background: {
      default: '#FEF7FF',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <FishboneProvider>
        <Box sx={{ display: 'flex', height: '100vh' }}>
          <Sidebar />
          <Box sx={{ flexGrow: 1, p: 2 }}>
            <FishboneCanvas />
          </Box>
        </Box>
      </FishboneProvider>
    </ThemeProvider>
  );
}

export default App;
