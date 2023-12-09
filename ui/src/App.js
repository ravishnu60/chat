import React from 'react';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

const Layout = React.lazy(() => import('./Menus/Layout.js'));
const Login = React.lazy(() => import('./Pages/Login.js'));
const Main = React.lazy(() => import('./Pages/Main.js'));

function App() {
  return (
    <div className="min vh-100">
      <BrowserRouter >
        <Routes>
          <Route path='/login' name="login" element={<Login />} />
          <Route path='/main' name="login" element={<Main />} />
          <Route path='*' name="" element={<Layout />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
