import React from 'react';
import './App.css';
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom';

const Layout = React.lazy(() => import('./Menus/Layout.js'));

function App() {
  return (
    <div className="">
      <HashRouter >
        <Routes>
          <Route path='*' name="" element={<Layout />} />
        </Routes>
      </HashRouter>
    </div>
  );
}

export default App;
