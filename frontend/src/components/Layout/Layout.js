import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as ProductsIcon,
  ShoppingCart as SalesIcon,
  People as CustomersIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  AdminPanelSettings as AdminIcon,
  History as HistoryIcon,
  Storage as DatabaseIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { getText } from '../../utils/textConfig';
import { hasPermission, canAccessRoute } from '../../utils/permissions';

const drawerWidth = 240;
const collapsedDrawerWidth = 65;

const getMenuItems = (user) => [
  { text: getText('nav.dashboard', 'Dashboard'), icon: <DashboardIcon />, path: '/dashboard', permission: 'dashboard' },
  { text: getText('nav.products', 'Products'), icon: <ProductsIcon />, path: '/products', permission: 'products' },
  { text: getText('nav.sales', 'Sales'), icon: <SalesIcon />, path: '/sales', permission: 'sales' },
  { text: getText('nav.customers', 'Customers'), icon: <CustomersIcon />, path: '/customers', permission: 'customers' },
  { text: getText('nav.settings', 'Settings'), icon: <SettingsIcon />, path: '/settings', permission: 'settings' },
  // Log History is admin/dev only
  ...((user?.username === 'admin' || user?.username === 'dev') ? [{ text: getText('nav.logs', 'Log History'), icon: <HistoryIcon />, path: '/logs', permission: 'logs' }] : []),
  // Database View is dev only
  ...(user?.username === 'dev' ? [{ text: getText('nav.databaseView', 'Database View'), icon: <DatabaseIcon />, path: '/database-view', permission: 'databaseView' }] : []),
];

function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDesktopDrawerToggle = () => {
    setDesktopOpen(!desktopOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };

  // Filter menu items based on user permissions
  const allMenuItems = getMenuItems(user);
  const menuItems = allMenuItems.filter((item) => {
    // Log History is already filtered in getMenuItems
    if (item.permission === 'logs') {
      return true; // Already filtered above
    }
    // Database View is already filtered in getMenuItems (dev only)
    if (item.permission === 'databaseView') {
      return true; // Already filtered above
    }
    if (item.permission === 'settings') {
      // Show settings if user has any settings permission
      return user?.permissions?.some(p => p.startsWith('settings'));
    }
    return hasPermission(user?.permissions, item.permission);
  });

  // Redirect if user tries to access unauthorized page
  React.useEffect(() => {
    if (user && location.pathname !== '/login') {
      const path = location.pathname.substring(1); // Remove leading slash
      
      // Special case for database-view (dev only)
      if (path === 'database-view') {
        if (user.username !== 'dev') {
          navigate('/products');
        }
        return; // Allow dev user to access
      }
      
      if (!canAccessRoute(user.permissions, path)) {
        navigate('/products'); // Redirect to products (default accessible page)
      }
    }
  }, [location.pathname, user, navigate]);

  const drawer = (isCollapsed = false) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ justifyContent: isCollapsed ? 'center' : 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
        {!isCollapsed && (
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {getText('appName', 'EMS')}
              </Typography>
            )}
            {isCollapsed && (
              <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {getText('appName', 'EMS').charAt(0)}
              </Typography>
        )}
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ px: isCollapsed ? 0.5 : 1 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                minHeight: 48,
                justifyContent: isCollapsed ? 'center' : 'initial',
                px: 2.5,
                borderRadius: 1,
                mx: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: isCollapsed ? 'auto' : 3,
                  justifyContent: 'center',
                  color: location.pathname === item.path ? 'inherit' : 'text.secondary',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!isCollapsed && <ListItemText primary={item.text} />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        color="default"
        elevation={1}
        sx={{
          width: { 
            xs: '100%',
            sm: desktopOpen ? `calc(100% - ${drawerWidth}px)` : `calc(100% - ${collapsedDrawerWidth}px)`
          },
          ml: { 
            xs: 0,
            sm: desktopOpen ? `${drawerWidth}px` : `${collapsedDrawerWidth}px`
          },
          backgroundColor: 'white',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          transition: (theme) => theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            aria-label="toggle drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' }, color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>
          <IconButton
            aria-label="toggle drawer"
            onClick={handleDesktopDrawerToggle}
            sx={{ mr: 2, display: { xs: 'none', sm: 'block' }, color: 'text.primary' }}
          >
            {desktopOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'text.primary' }}>
            {getText('appFullName', 'Enterprise Management System')}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              onClick={handleMenu}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 0.75,
                borderRadius: 2,
                cursor: 'pointer',
                backgroundColor: 'transparent',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderColor: 'primary.main',
                },
              }}
            >
              <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2, color: 'text.primary' }}>
                  {user?.full_name}
                </Typography>
                {(user?.username === 'admin' || user?.username === 'dev') && (
                  <Chip
                    icon={<AdminIcon style={{ fontSize: '0.9rem', marginLeft: '4px' }} />}
                    label={user?.username === 'dev' ? 'DEVELOPER' : 'ADMIN'}
                    size="small"
                    color="success"
                    sx={{
                      height: 18,
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      mt: 0.25,
                    }}
                  />
                )}
              </Box>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  backgroundColor: user?.username === 'admin' || user?.username === 'dev' ? '#4caf50' : 'primary.main',
                  fontWeight: 'bold',
                }}
              >
                {user?.username === 'admin' || user?.username === 'dev' ? 
                  <AdminIcon /> : 
                  user?.full_name?.charAt(0).toUpperCase()
                }
              </Avatar>
            </Box>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                elevation: 8,
                sx: {
                  mt: 1.5,
                  minWidth: 220,
                  borderRadius: 2,
                  overflow: 'visible',
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
            >
              <Box sx={{ px: 2.5, py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      backgroundColor: user?.username === 'admin' || user?.username === 'dev' ? '#4caf50' : 'primary.main',
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                    }}
                  >
                    {user?.username === 'admin' || user?.username === 'dev' ? 
                      <AdminIcon /> : 
                      user?.full_name?.charAt(0).toUpperCase()
                    }
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                      {user?.full_name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.2 }}>
                      @{user?.username}
                    </Typography>
                  </Box>
                </Box>
                {(user?.username === 'admin' || user?.username === 'dev') && (
                  <Chip
                    icon={<AdminIcon style={{ fontSize: '0.9rem', marginLeft: '4px' }} />}
                    label={user?.username === 'dev' ? 'DEVELOPER' : 'ADMIN'}
                    size="small"
                    color="success"
                    sx={{
                      fontWeight: 'bold',
                    }}
                  />
                )}
              </Box>
              <Divider />
              <MenuItem 
                onClick={handleLogout}
                sx={{
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: 'rgba(211, 47, 47, 0.08)',
                  },
                }}
              >
                <ListItemIcon>
                  <LogoutIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText 
                  primary={getText('auth.logout', 'Logout')}
                  primaryTypographyProps={{
                    fontWeight: 500,
                  }}
                />
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ 
          width: { 
            xs: 0,
            sm: desktopOpen ? drawerWidth : collapsedDrawerWidth 
          }, 
          flexShrink: { sm: 0 } 
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawer(false)}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: desktopOpen ? drawerWidth : collapsedDrawerWidth,
              transition: (theme) => theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
              backgroundColor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          open
        >
          {drawer(!desktopOpen)}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { 
            xs: '100%',
            sm: desktopOpen ? `calc(100% - ${drawerWidth}px)` : `calc(100% - ${collapsedDrawerWidth}px)`
          },
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          transition: (theme) => theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;

