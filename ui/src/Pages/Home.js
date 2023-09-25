import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { alert, base_url, userstatus } from '../Utils/Utility';
import axios from 'axios';

function Home() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState();
  const navigate = useNavigate();
  const header = { "Authorization": "bearer " + localStorage.getItem('token') }

  const getchatlist = () => {
    axios({
      method: 'get',
      url: `${base_url}/chatlist`,
      headers: header
    }).then((res) => {
      setList(res.data?.data)
    }).catch((err) => {
      userstatus(navigate, header);
      setList([]);
    })
  }

  const newChat =()=>{
    axios({
      method: 'get',
      url: `${base_url}/find/${search}`,
      headers: header
    }).then((res) => {
      setSearch();
      navigate('/chat', { state: { id: res?.data?.data?.user_id, name: res?.data?.data?.name } })
    }).catch((err) => {
      userstatus(navigate, header);
      alert('User not found',false)
    })
  }

  useEffect(() => {
    userstatus(navigate, header);
    getchatlist();
  }, []);
  return (
    <>
      <div class="input-group mb-2">
        <input type="number" value={search} onChange={(e)=>setSearch(e.target.value)} class="form-control" placeholder="Enter mobile no." />
        <div class="input-group-append">
          <button class="input-group-text" onClick={newChat} ><i className='fa fa-arrow-right text-primary'></i></button>
        </div>
      </div>
      <div className='list-group'>
        {
          list?.map((item) => (
            <button type="button" 
              onClick={() => { navigate('/chat', { state: { id: item.user_id, name: item?.name } }) }} 
              className="list-group-item list-group-item-info text-left text-dark font-weight-bold text-capitalize ">
              {item?.name}
            </button>
          ))
        }
        {list?.length == 0 && <div className='text-center text-secondary h4'>No chats</div>}
      </div>
    </>
  )
}

export default Home