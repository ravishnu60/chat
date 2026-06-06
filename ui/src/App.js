import React, { Suspense } from 'react';
import './App.css';
import { HashRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { loadingFunc } from './Utils/Utility.js';

const Login = React.lazy(() => import('./Pages/Login.js'));
const Main = React.lazy(() => import('./Pages/Main.js'));

function App() {
  return (
    <div className="min vh-100"> 
      <Router >
        <Suspense fallback={loadingFunc(true)}>
          <Routes>
            <Route path='/login' name="login" element={<Login />} />
            <Route path='/home' name="home" element={<Main />} />
            <Route path='*' name="home" element={ <Navigate replace to="/login" />} />
          </Routes>
        </Suspense>
      </Router>
    </div>
  );
}

export default App;
