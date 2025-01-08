import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Components will be imported here
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
