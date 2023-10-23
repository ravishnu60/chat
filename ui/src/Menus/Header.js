import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { userstatus } from '../Utils/Utility';
import logo from '../Assets/logo.png'
import { Link } from 'react-router-dom';
import '../Style/style.css'

function Header(props) {
  const location = useLocation();
  const navigate = useNavigate();
  const header = { "Authorization": "bearer " + localStorage.getItem('token') };
  const [user, setUser] = useState();

  const signout = () => {
    setUser();
    navigate('/');
  }
  const getUser = async () => {
    const data = await userstatus(navigate, header);
    setUser(data?.data)
  }

  useEffect(() => {
    setTimeout(() => {
      if (!(location.pathname == '/'))
        getUser();
    }, 400);
  }, [])
  return (
    <div className='fixed-top'>
      <div className='text-center p-1 d-flex justify-content-between align-items-center header'>
        <div></div>
        <div className='h5 fw-bold offset-1'><span className='align-bottom'>Connect</span> <img src={logo} width={25} /> </div>
        <div className='d-flex align-items-center'>
          <button className='btn btn-danger btn-sm' title='sign out' hidden={location.pathname === '/login' ? true : false} onClick={signout}><i className='fas fa-sign-out-alt'></i></button>
        </div>
      </div>
      {user?.name && <div className='text-center bg-white h6 p-1'>Welcome <Link onClick={()=>location.pathname !== '/chat' && props.onClick(true)} className='text-success'><u>{user?.name}</u> </Link></div>}
    </div>
  )
}

export default Header