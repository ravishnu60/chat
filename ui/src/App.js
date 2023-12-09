import React from 'react';
import './App.css';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

const Login = React.lazy(() => import('./Pages/Login.js'));
const Main = React.lazy(() => import('./Pages/Main.js'));

function App() {
  return (
    <div className="min vh-100">
      <BrowserRouter >
        <Routes>
          <Route path='/login' name="login" element={<Login />} />
          <Route path='/home' name="home" element={<Main />} />
          <Route path='*' name="home" element={ <Navigate replace to="/login" />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
