import React from 'react';
import logo from './yt.png';
import { Box, Tooltip, IconButton, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home as HomeIcon,
  TrendingUp as ProgressIcon,
  ManageSearch as LibraryIcon,
} from '@mui/icons-material';
import './Header.scss';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: <HomeIcon fontSize="small" />, label: 'Home' },
    { path: '/progress', icon: <ProgressIcon fontSize="small" />, label: 'Progress' },
    { path: '/search-library', icon: <LibraryIcon fontSize="small" />, label: 'Library' },
  ];

  return (
    <Box className="header-container" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <img className="logo" src={logo} alt="Logo" />
        <div className="header styled-color shadow">Assistant</div>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Tooltip key={item.path} title={item.label} placement="bottom">
              <IconButton
                onClick={() => navigate(item.path)}
                sx={{
                  color: isActive ? 'white' : 'rgba(255,255,255,0.4)',
                  background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                  borderRadius: 2,
                  px: 1.5,
                  py: 0.8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  '&:hover': { background: 'rgba(255,255,255,0.1)', color: 'white' },
                  transition: 'all 0.2s'
                }}
              >
                {item.icon}
                <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: isActive ? 700 : 400 }}>
                  {item.label}
                </Typography>
              </IconButton>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}

export default Header;
