import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Practice from './pages/Practice';
import DAO from './pages/DAO';
import Upload from './pages/Upload';
import Profile from './pages/Profile'; 
import Leaderboard from './pages/Leaderboard';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="practice" element={<Practice />} />
        <Route path="dao" element={<DAO />} />
        <Route path="upload" element={<Upload />} />
        <Route path="profile" element={<Profile />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

export default App;