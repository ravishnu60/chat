import React from 'react'
import { useLocation, useNavigate } from 'react-router'
import logo from '../Assets/logo.png'
import { Link } from 'react-router-dom';
import '../Style/style.css'
import { isMobile } from '../Utils/Utility';

function Header({user}) {
  const location = useLocation();
  const navigate = useNavigate();

  const signout = () => {
    navigate('/');
  }
  return (
    <div className=''>
      <div className='text-center p-1 d-flex justify-content-between align-items-center header'>
        <div></div>
        <div className='h5 fw-bold offset-1'><span className='align-bottom'>Connect</span> <img src={logo} width={25} /> </div>
        <div className='d-flex align-items-center'>
          <button className='btn btn-danger btn-sm' title='sign out' hidden={location.pathname === '/login' ? true : false} onClick={signout}><i className='fas fa-sign-out-alt'></i></button>
        </div>
      </div>
      {isMobile && <div className='text-center bg-white h5 p-1'>Welcome <span className='text-success'>{user?.name} </span></div>}
    </div>
  )
}

export default Header