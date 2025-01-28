import React from 'react';
import logo from './yt.png';
import { Box } from '@mui/material';
import './Header.scss';

function Header() {
  return (
    <Box className="header-container">
      <img className="logo" src={logo} alt="Logo" />
      <div className="header styled-color shadow">Assistant</div>
    </Box>
  );
}

export default Header;
