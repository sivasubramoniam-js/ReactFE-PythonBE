import { AppBar, Toolbar, Typography, IconButton, Avatar } from "@mui/material";
import "./Header.scss";
import { useState } from "react";
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
// import Avatar from "@mui/";

const Header = ({ handleDrawerOpen }) => {
  const [open, setOpen] = useState(false);
  return (
    <AppBar position="sticky" className="header" sx={{ background: "transparent"}}>
      <Toolbar>
        <Typography variant="h6" sx={{ fontWeight: "bold" }} className="header-title">
        Docs AI
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: "bold", flexGrow: 1 }} className="header-title">
        </Typography>
        <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="end"
            onClick={() => {
              const uodatedOpenStatus = !open;
              handleDrawerOpen(uodatedOpenStatus)
              setOpen(uodatedOpenStatus)
            }}
          >
            {open ? <CloseIcon style={{ color: 'gray' }} /> : <MenuIcon style={{ color: 'gray' }} />}
          </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
