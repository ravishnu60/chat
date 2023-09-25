import React, { useEffect, useState } from 'react'
import { useLoaderData, useLocation, useNavigate } from 'react-router-dom';
import { base_url, userstatus } from '../Utils/Utility';
import axios from 'axios';
import { useForm } from 'react-hook-form';

function Chat() {
  const location = useLocation();
  const navigate = useNavigate();

  const userData = location.state;
  const [chat, setChat] = useState([]);
  const [scroll, setScroll] = useState(false);
  const [count, setCount] = useState(false);
  const { register, reset, handleSubmit } = useForm();

  const header = { "Authorization": "bearer " + localStorage.getItem('token') }

  const continuousAPI = () => {
    axios({
      method: 'get',
      url: `${base_url}/pastchat/${userData?.id}`,
      headers: header
    }).then((res) => {
      setChat(res.data?.data);
      setScroll(true);
      setCount(!count)
    }).catch((err) => {
      userstatus(navigate, header);
      setChat([]);
    })
  }

  const sendMsg = (data) => {
    if (data.msg !== '') {
      let temp = {
        to_id: userData?.id,
        message: data.msg
      }

      axios({
        method: 'POST',
        url: `${base_url}/message`,
        headers: header,
        data: temp
      }).then((res) => {
        reset();
        setScroll(!scroll);
      }).catch((err) => {

      });
    }
  }


  useEffect(() => {
    userstatus(navigate, header);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      continuousAPI();
    }, 800);
  }, [count])

  useEffect(() => {
    chat?.length !== 0 && document.getElementById('chatDiv')?.scrollTo(0, document.getElementById('chatDiv')?.scrollHeight);
  }, [scroll])

  return (
    <div className='container'>
      <div className='border border-info rounded'>
        <div className='d-flex justify-content-between align-items-center p-2 bg-info text-light'>
          <h4>{userData?.name}</h4>
          <button className='btn text-right' onClick={() => { navigate('/home') }}><i className='fa fa-arrow-left'> </i></button>
        </div>
        <div id="chatDiv" className='p-2' style={{ maxHeight: '60vh', overflowX: 'hidden', overflowY: 'auto' }}>
          {chat?.map((data, index) =>
            <div className='row p-3' key={index}>
              {data?.from_id ?
                <>
                  <div className='col-7'></div>
                  <div className='col-5 text-right'><div className='border border-primary rounded p-2'>{data?.message}</div><i className='fas fa-sm fa-thumbs-up'></i></div>
                </>
                : <div className='col-5 border border-success rounded'><div className='p-1'>{data?.message}</div></div>}
            </div>
            // <div className={data?.from_id ? 'd-flex flex-row-reverse mt-2':'mt-2'}>
            //   <div className='border border-primary d-inline-flex p-2 rounded'>{data?.message}</div>
            // </div>
          )}
          {chat?.length == 0 && <div className=" text-secondary text-center">Start communication</div>}
        </div>
      </div>
      <div className='mt-2'>
        <form className='input-group' onSubmit={handleSubmit(sendMsg)}>
          <input className='form-control border-secondary'
            placeholder='Message here'
            {...register('msg', { required: true })} />
          <button className=' input-group-text p-2 border border-success rounded' type='submit'><i className='fa fa-arrow-right'></i></button>
        </form>
      </div>
    </div>
  )
}

export default Chat