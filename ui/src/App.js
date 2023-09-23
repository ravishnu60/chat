import React from 'react';
import './App.css';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';

const Login = React.lazy(()=>import('./Pages/Login.js'));
const Home = React.lazy(()=>import('./Pages/Home.js'));
const Chat = React.lazy(()=>import('./Pages/Chat.js'));

function App() {
  return (
    <div className="">
    <BrowserRouter >
      <Routes>
      <Route path='/login' element={<Login/>} />
      <Route path='/home' element={<Home/>} />
      <Route path='/chat' element={<Chat/>} />
      <Route path='/' name="" element={<Navigate replace to='/login' />}></Route>
      </Routes>
    </BrowserRouter>
    </div>
  );
}

export default App;
