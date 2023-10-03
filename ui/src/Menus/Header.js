import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { userstatus } from '../Utils/Utility';
import logo from '../Assets/logo.png'
import { Link } from 'react-router-dom';

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
  }, [props])
  return (
    <div className='fixed-top'>
      <div className='text-center p-2 bg-primary text-light d-flex justify-content-between align-items-center'>
        <div></div>
        <div className='h5 fw-bold offset-1'>Connect <img src={logo} width={25} /> </div>
        <div className='d-flex align-items-center'>
          <button className='btn btn-danger' hidden={location.pathname === '/login' ? true : false} onClick={signout}>Sign out</button>
        </div>
      </div>
      {user?.name && <div className='text-center bg-white h4'>Welcome <Link to='/home' className='text-success'><u>{user?.name}</u> </Link></div>}
    </div>
  )
}

export default Header