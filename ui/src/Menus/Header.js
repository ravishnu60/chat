import React from 'react'
import { useLocation, useNavigate } from 'react-router'
import logo from '../Assets/logo.png'
import { Link } from 'react-router-dom';
import '../Style/style.css'

function Header({user}) {
  const location = useLocation();
  const navigate = useNavigate();

  const signout = () => {
    navigate('/');
  }
  return (
    <div className="header-navbar">
      <div className="header-logo-group">
        <span className="header-title">Connect</span>
        <img src={logo} width={28} className="header-logo" alt="logo" />
      </div>
      <div className="header-actions">
        {user?.name && (
          <span className="header-welcome-text d-none d-md-inline">
            Welcome, <span className="header-username">{user?.name}</span>
          </span>
        )}
        <button
          className="header-signout-btn"
          title="Sign Out"
          hidden={location.pathname === '/login'}
          onClick={signout}
        >
          <i className="fas fa-sign-out-alt"></i> Sign Out
        </button>
      </div>
    </div>
  )
}

export default Header