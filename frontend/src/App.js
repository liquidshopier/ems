import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Products from './pages/Products/Products';
import Sales from './pages/Sales/Sales';
import Customers from './pages/Customers/Customers';
import Settings from './pages/Settings/Settings';
import Logs from './pages/Logs/Logs';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

function App() {
  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = () => {
    try {
      // Text configuration is now loaded dynamically via getTextConfig()
      // No need to mutate TEXT_CONFIG here

      // Load appearance configuration from localStorage
      const savedStyles = localStorage.getItem('app_styles');
      if (savedStyles) {
        const styles = JSON.parse(savedStyles);
        document.documentElement.style.setProperty('--font-family', styles.fontFamily);
        document.documentElement.style.setProperty('--font-size', `${styles.fontSize}px`);
        document.documentElement.style.setProperty('--input-font-family', styles.inputFontFamily);
        document.documentElement.style.setProperty('--input-font-size', `${styles.inputFontSize}px`);
        document.documentElement.style.setProperty('--heading-font-family', styles.headingFontFamily);
        document.documentElement.style.setProperty('--border-radius', `${styles.borderRadius}px`);
        document.documentElement.style.setProperty('--primary-color', styles.primaryColor);
        document.documentElement.style.setProperty('--secondary-color', styles.secondaryColor);
        document.documentElement.style.setProperty('--background-color', styles.backgroundColor);
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="sales" element={<Sales />} />
              <Route path="customers" element={<Customers />} />
              <Route path="settings" element={<Settings />} />
              <Route path="logs" element={<Logs />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

