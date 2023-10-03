import React from 'react';
import './App.css';
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom';

const Layout = React.lazy(() => import('./Menus/Layout.js'));
const Login = React.lazy(() => import('./Pages/Login.js'));

function App() {
  return (
    <div className="min vh-100">jnythnty
      <HashRouter >
        <Routes>
          <Route path='/login' name="login" element={<Login />} />
          <Route path='*' name="" element={<Layout />} />
        </Routes>
      </HashRouter>
    </div>
  );
}

export default App;
