import React from 'react';
import { Grid } from '@mui/material';
import Header from './Header';
import YouTubeSearch from './YT';
import Chat from './Chat';
import Assistant from './Assistant';
import "./App.css"

function App() {
  return (
    <div className="app">
      <Header />
      <Grid container className="main" padding={2}>
        <Grid item style={{height: "100%"}} xs={12} sm={12} md={3.5}>
          <YouTubeSearch />
        </Grid>
        <Grid item xs={12} sm={12} md={5}>
          <Chat />
        </Grid>
        <Grid item xs={12} sm={12} md={3.5} height="100%">
          <Assistant />
        </Grid>
      </Grid>
    </div>
  );
}

export default App;
