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
    if(search && search?.toString()?.length >9){axios({
      method: 'get',
      url: `${base_url}/find/${search}`,
      headers: header
    }).then((res) => {
      setSearch();
      navigate('/chat', { state: { id: res?.data?.data?.user_id, name: res?.data?.data?.name } })
    }).catch((err) => {
      userstatus(navigate, header);
      alert('User not found',false)
    })}
  }

  useEffect(() => {
    userstatus(navigate, header);
    getchatlist();
  }, []);
  return (
    <>
      <div class="input-group">
        <input type="number" value={search} onChange={(e)=>setSearch(e.target.value)} class="form-control" placeholder="Enter mobile no." />
        <div class="input-group-append">
          <button class="input-group-text" onClick={newChat} ><i className='fa fa-search text-primary'></i></button>
        </div>
      </div>
      {search && search?.toString()?.length<10 && <div className='text-danger'>Enter valid number</div>}
      <div className='list-group mt-2 border border-success rounded' >
        {
          list?.map((item,index) => (
            <button type="button" 
              onClick={() => { navigate('/chat', { state: { id: item.user_id, name: item?.name } }) }} 
              className="list-group-item text-left text-dark font-weight-bold text-capitalize " 
              style={index%2==0 ? {background:'linear-gradient(45deg,rgb(101 220 255),#e6fffd'}: {background:'white'}}>
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