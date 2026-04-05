import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Explore from './pages/Explore';
import TripPlanner from './pages/TripPlanner';
import TripView from './pages/TripView';
import './App.css';

const MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyAHRN8CJPiWGwu9CfSvQcvflP6TOxjI1HU';
const API = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:5000';

export const AppContext = React.createContext({ mapsKey: '', api: '', sessionId: '' });

function App() {
  const [sessionId] = React.useState(() => {
    let id = localStorage.getItem('ww_session');
    if (!id) { id = crypto.randomUUID().slice(0, 12); localStorage.setItem('ww_session', id); }
    return id;
  });

  return (
    <AppContext.Provider value={{ mapsKey: MAPS_KEY, api: API, sessionId }}>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/plan" element={<TripPlanner />} />
          <Route path="/trip/:id" element={<TripView />} />
        </Routes>
      </Router>
    </AppContext.Provider>
  );
}

export default App;
