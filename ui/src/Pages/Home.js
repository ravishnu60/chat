import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { alert, base_url, loadingFunc, showNotification, userstatus } from '../Utils/Utility';
import axios from 'axios';
import '../Style/style.css'

function Home() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState();
  const [update, setUpdate] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState();
  const [loading, setLoading] = useState(true);
  const header = { "Authorization": "bearer " + localStorage.getItem('token') }

  const getchatlist = () => {
    list?.length == 0 && setLoading(true);
    axios({
      method: 'get',
      url: `${base_url}/chatlist`,
      headers: header
    }).then((res) => {
      let temp = res.data?.data;
      let popup = false;
      if (list?.length !== 0) {
        temp?.forEach((element, index) => {
          if (element?.newmsg != list[index].newmsg)
            popup = true;
        });
      }
      popup && showNotification(`Excuse me ${user?.name}`, 'Some one texting you');
      setUpdate(!update);
      list?.length == 0 && setLoading(false);
      setList(temp);
    }).catch((err) => {
      userstatus(navigate, header);
      setList([]);
      setLoading(false);
    })
  }

  const newChat = () => {
    if (search && search?.toString()?.length > 9) {
      axios({
        method: 'get',
        url: `${base_url}/find/${search}`,
        headers: header
      }).then((res) => {
        setSearch();
        navigate('/chat', { state: { id: res?.data?.data?.user_id, name: res?.data?.data?.name } })
      }).catch((err) => {
        userstatus(navigate, header);
        alert('User not found', false)
      })
    }
  }

  const getUser = async () => {
    const data = await userstatus(navigate, header);
    setUser(data?.data)
  }

  useEffect(() => {
    getchatlist();
    getUser();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      list?.length !== 0 && getchatlist();
    }, 1000);
  }, [update]);
  return (
    <>
      {loadingFunc(loading)}
      <div class="input-group">
        <input type="number" value={search} onChange={(e) => setSearch(e.target.value)} class="form-control" placeholder="Enter mobile no." />
        <div class="input-group-append">
          <button class="input-group-text" onClick={newChat} ><i className='fa fa-search text-primary'></i></button>
        </div>
      </div>
      {search && search?.toString()?.length < 10 && <div className='text-danger'>Enter valid number</div>}
      <div className='list-group mt-2 border border-success rounded' >
        {
          list?.map((item, index) => (
            <div
              onClick={() => { navigate('/chat', { state: { id: item.user_id, name: item?.name } }) }}
              className="list-group-item text-dark font-weight-bold text-capitalize d-flex justify-content-between"
              style={index % 2 == 0 ?
                { background: 'linear-gradient(45deg, #65dcff8f, #e6fffb00)', cursor: 'pointer' } :
                { background: 'white', cursor: 'pointer' }}
                >
              <div>{item?.name}</div>
              {item?.newmsg !== 0 && <div className='bg-info text-light px-2 rounded'>{item?.newmsg}</div>}
            </div>
          ))
        }
        {(list?.length == 0 && !loading) && <div className='text-center text-secondary h4'>No chats</div>}
      </div>
    </>
  )
}

export default Home