import React from "react";
import { useTranslation } from "react-i18next";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Box,
  Button,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Notifications,
  Settings,
  Help,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";

const Header = ({ toggleSidebar }) => {
  const { t, i18n } = useTranslation();
  const { currentUser, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    try {
      await signOut();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        boxShadow: "none",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
      square
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={toggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {t('navigation.dashboard')}
        </Typography>

        <Box sx={{ mr: 2 }}>
          <Button 
            color="inherit" 
            onClick={() => changeLanguage('en')}
            variant={i18n.language === 'en' ? 'contained' : 'text'}
            sx={{ 
              minWidth: 'auto', 
              px: 1,
              backgroundColor: i18n.language === 'en' ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            🇺🇸 EN
          </Button>
          <Button 
            color="inherit" 
            onClick={() => changeLanguage('ar')}
            variant={i18n.language === 'ar' ? 'contained' : 'text'}
            sx={{ 
              minWidth: 'auto', 
              px: 1,
              backgroundColor: i18n.language === 'ar' ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            🇸🇦 عربي
          </Button>
        </Box>

        <IconButton color="inherit" aria-label="help">
          <Help />
        </IconButton>

        <IconButton color="inherit" aria-label="notifications">
          <Badge badgeContent={3} color="error">
            <Notifications />
          </Badge>
        </IconButton>

        <IconButton color="inherit" aria-label="settings">
          <Settings />
        </IconButton>

        <IconButton
          onClick={handleMenu}
          color="inherit"
          aria-label="account"
          aria-controls="menu-appbar"
          aria-haspopup="true"
        >
          <Avatar
            alt={currentUser?.displayName || currentUser?.email}
            src="/static/images/avatar/1.jpg"
          />
        </IconButton>

        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          keepMounted
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          open={open}
          onClose={handleClose}
        >
          <MenuItem onClick={handleClose}>
            <Typography variant="subtitle2">
              {currentUser?.displayName || currentUser?.email}
            </Typography>
          </MenuItem>
          <MenuItem onClick={handleClose}>{t('profile')}</MenuItem>
          <MenuItem onClick={handleClose}>{t('myAccount')}</MenuItem>
          <MenuItem onClick={handleLogout}>{t('logout')}</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
