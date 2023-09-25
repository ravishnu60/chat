import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { userstatus } from '../Utils/Utility';

function Header(props) {
  const location = useLocation();
  const navigate = useNavigate();
  const header = { "Authorization": "bearer " + localStorage.getItem('token') };
  const [user, setUser] = useState();

  const signout = () => {
    setUser();
    navigate('/login');
  }
  const getUser = async () => {
    const data = await userstatus(navigate, header);
    setUser(data?.data)
  }
  
  useEffect(() => {
    setTimeout(() => {
      if(!(location.pathname =='/login'))
        getUser();
    }, 400);
  }, [props])
  return (
    <div className='fixed-top text-center p-2 bg-primary text-light d-flex justify-content-between'>
      <div className=' h4 fw-bold'>Connect</div>
      <div className='d-flex align-items-center'>
        {user?.name && <h5 className='mr-3'>Welcome! {user?.name}</h5>}
        <button className='btn btn-danger' hidden={location.pathname === '/login' ? true : false} onClick={signout}>Sign out</button>
      </div>
    </div>
  )
}

export default Header