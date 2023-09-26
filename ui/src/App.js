import React from 'react';
import './App.css';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';

const Layout = React.lazy(() => import('./Menus/Layout.js'));

function App() {
  return (
    <div className="">
      <BrowserRouter >
        <Routes>
          <Route path='*' name="" element={<Layout />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
