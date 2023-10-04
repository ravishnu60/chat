import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { alert, base_url, loadingFunc, permission, showNotification, userstatus } from '../Utils/Utility';
import axios from 'axios';
import '../Style/style.css';
import findperson from '../Assets/find-person.png'
import profile from '../Assets/profile.png'
import { useForm } from 'react-hook-form';

function Home() {
  const [list, setList] = useState([]);
  const [update, setUpdate] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState();
  const [loading, setLoading] = useState(true);
  const header = { "Authorization": "bearer " + localStorage.getItem('token') }
  const { register, formState: { errors }, reset, handleSubmit, } = useForm();


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
      setList(temp);
      if (popup)
        showNotification(`Excuse me ${user?.name}`, 'Some one texting you');

      setUpdate(!update);
      setLoading(false);
    }).catch((err) => {
      userstatus(navigate, header);
      // setList([]);
      setLoading(false);
    })
  }

  const newChat = (data) => {
    const search = data.search;
    if (search && search?.toString()?.length > 9) {
      axios({
        method: 'get',
        url: `${base_url}/find/${search}`,
        headers: header
      }).then((res) => {
        reset();
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
    permission !== "granted" && Notification?.requestPermission();
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
      <form onSubmit={handleSubmit(newChat)}>
        <div class="input-group">
          <input type="number" class="form-control"
            autoComplete='off'
            placeholder="Enter mobile no."
            {...register('search', { required: true, minLength: 10 })}
            aria-invalid={errors?.password ? "true" : "false"}
          />
          <div class="input-group-append">
            <button class="input-group-text py-0" type='submit' title='search' ><img src={findperson} width={30} /></button>
          </div>
        </div>
        {errors?.search?.type == 'minLength' && <div className='text-danger'>Enter valid number</div>}
      </form>

      <div className='list-group mt-2 border border-success rounded' style={{ cursor: 'pointer' }} >
        {
          list?.map((item, index) => (
            <div
              key={index}
              onClick={() => { navigate('/chat', { state: { id: item.user_id, name: item?.name } }) }}
              className="list-group-item text-dark font-weight-bold text-capitalize d-flex justify-content-between"
            >
              <div><img src={profile} width={30} className='mr-3'/> {item?.name}</div>
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