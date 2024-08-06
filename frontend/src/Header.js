import React from 'react'
import "./Header.css"
import logo from "./yt.png"
import { Box } from '@mui/material'

function Header() {
  return (
    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <img style={{width: "75px", height: "75px"}} src={logo} />
      <div className='header'>Assistant</div>
    </Box>
  )
}

export default Header