import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import Sidebar from './components/Sidebar';
import FishboneCanvas from './components/FishboneCanvas';
import { FishboneProvider } from './hooks/useFishboneData';

// Material Design 3 Theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6750A4',
      light: '#7F67BE',
      dark: '#4F378B',
    },
    secondary: {
      main: '#625B71',
      light: '#7D7489',
      dark: '#4A4458',
    },
    surface: {
      main: '#FEF7FF',
      variant: '#E7E0EC',
    },
    background: {
      default: '#FEF7FF',
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