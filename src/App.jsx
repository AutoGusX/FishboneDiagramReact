import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import Sidebar from './components/Sidebar';
import FishboneCanvas from './components/FishboneCanvas';
import { FishboneProvider } from './hooks/useFishboneData';

// Material Design 3 Theme - White, Gray, Orange, Light Blue
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#FF8C00', // Orange
      light: '#FFB347',
      dark: '#E67300',
    },
    secondary: {
      main: '#6B7280', // Gray
      light: '#9CA3AF',
      dark: '#4B5563',
    },
    info: {
      main: '#87CEEB', // Light Blue
      light: '#B6E5F7',
      dark: '#5BA7D9',
    },
    surface: {
      main: '#FFFFFF',
      variant: '#F5F5F5',
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h4: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 20,
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <FishboneProvider>
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
          <Sidebar />
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <FishboneCanvas />
          </Box>
        </Box>
      </FishboneProvider>
    </ThemeProvider>
  );
}

export default App; 