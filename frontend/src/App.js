import React from 'react';
import { Grid, Box, Tooltip, IconButton } from '@mui/material';
import Header from './Header';
import YouTubeSearch from './YT';
import Chat from './Chat';
import Assistant from './Assistant';
import Quiz from './Quiz';
import Progress from './Progress';
import SubtitleSearch from './SubtitleSearch';
import { useSelector } from 'react-redux';
import './App.scss';
import {
  TrendingUp as ProgressIcon,
  ManageSearch as SearchIcon,
} from '@mui/icons-material';

import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

function HomeToolbar() {
  const navigate = useNavigate();
  return (
    <Box sx={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 1.2,
      zIndex: 1200
    }}>
      <Tooltip title="My Learning Progress" placement="left">
        <IconButton
          onClick={() => navigate('/progress')}
          sx={{
            background: 'linear-gradient(135deg, #FF9800, #f44336)',
            color: 'white',
            width: 52, height: 52,
            boxShadow: '0 4px 20px rgba(255,152,0,0.5)',
            '&:hover': { transform: 'scale(1.1)', boxShadow: '0 6px 24px rgba(255,152,0,0.7)' },
            transition: 'all 0.2s'
          }}
        >
          <ProgressIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Search My Video Library" placement="left">
        <IconButton
          onClick={() => navigate('/search-library')}
          sx={{
            background: 'linear-gradient(135deg, #2196F3, #00BCD4)',
            color: 'white',
            width: 52, height: 52,
            boxShadow: '0 4px 20px rgba(33,150,243,0.5)',
            '&:hover': { transform: 'scale(1.1)', boxShadow: '0 6px 24px rgba(33,150,243,0.7)' },
            transition: 'all 0.2s'
          }}
        >
          <SearchIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

function Home() {
  return (
    <>
      <Grid container className="main" padding={2} spacing={2}>
        <Grid item xs={12} sm={12} md={3.5} sx={{ height: { xs: 'auto', md: '100%' } }}>
          <YouTubeSearch />
        </Grid>
        <Grid item xs={12} sm={12} md={5} sx={{ height: { xs: 'auto', md: '100%' } }}>
          <Chat />
        </Grid>
        <Grid item xs={12} sm={12} md={3.5} sx={{ height: { xs: 'auto', md: '100%' } }}>
          <Assistant />
        </Grid>
      </Grid>
      <HomeToolbar />
    </>
  );
}

function FullPage({ children }) {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: 'calc(100vh - 75px)', p: 2, maxWidth: 900, mx: 'auto' }}>
      <Box
        onClick={() => navigate('/')}
        sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, cursor: 'pointer',
          color: '#aaa', mb: 2, '&:hover': { color: 'white' }, fontSize: '0.9rem' }}
      >
        ← Back to Home
      </Box>
      {children}
    </Box>
  );
}

function Main() {
  const urlParams = new URLSearchParams(window.location.search);
  const isChallenge = urlParams.get('challenge');
  
  return isChallenge ? <Quiz /> : <Home />;
}

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/quiz/:videoId" element={<Quiz />} />
          <Route path="/progress" element={
            <FullPage><Progress /></FullPage>
          } />
          <Route path="/search-library" element={
            <FullPage><SubtitleSearch /></FullPage>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
