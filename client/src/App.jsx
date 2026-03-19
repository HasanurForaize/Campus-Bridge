import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar      from './components/Navbar';
import Login       from './components/Login';
import Register    from './components/Register';
import CourseList  from './components/CourseList';
import CourseDetail from './components/CourseDetail';
import './App.css';

// ─── Auth Context ─────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken]   = useState(() => localStorage.getItem('cb_token'));
  const [user,  setUser]    = useState(() => {
    try {
      const stored = localStorage.getItem('cb_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = (jwt, userData) => {
    localStorage.setItem('cb_token', jwt);
    localStorage.setItem('cb_user',  JSON.stringify(userData));
    setToken(jwt);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('cb_token');
    localStorage.removeItem('cb_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      <Router>
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/"           element={<CourseList />} />
            <Route path="/course/:id" element={<CourseDetail />} />
            <Route path="/login"      element={token ? <Navigate to="/" /> : <Login />} />
            <Route path="/register"   element={token ? <Navigate to="/" /> : <Register />} />
            <Route path="*"           element={<Navigate to="/" />} />
          </Routes>
        </main>
      </Router>
    </AuthContext.Provider>
  );
}
