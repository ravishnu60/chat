import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import { base_url, permission, requestPermission, userstatus, showNotification, loadingFunc } from '../Utils/Utility';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { useIdleTimer } from 'react-idle-timer';

function Chat() {
  const location = useLocation();
  const navigate = useNavigate();

  const userData = location.state;
  const [chat, setChat] = useState([]);
  const [scroll, setScroll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(false); //for continuous call
  const { register, reset, handleSubmit } = useForm();
  const [limit, setLimit] = useState(10);

  const header = { "Authorization": "bearer " + localStorage.getItem('token') };

  const continuousAPI = () => {
    axios({
      method: 'get',
      url: `${base_url}/pastchat?id=${userData?.id}&limit=${limit}`,
      headers: header
    }).then((res) => {
      let temp = res?.data?.data;
      if (chat?.length !== 0 && chat[chat?.length - 1]?.message != temp[temp?.length - 1]?.message) {
        if (permission === "granted") {
          if (temp[temp?.length - 1]?.from_id == false) {
            showNotification(`Message from ${userData?.name}`, temp[temp?.length - 1]?.message);
          }
        } else if (permission === "default") {
          requestPermission();
        }
        setScroll(!scroll);
      }
      chat?.length == 0 && setScroll(true);
      setChat(temp);
      setCount(!count);
      setLoading(false);
    }).catch((err) => {
      userstatus(navigate, header);
      setChat([]);
      setCount(!count);
      setLoading(false);
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
      }).catch((err) => {

      });
    }
  }

  const markasread=()=>{
    axios({
      method:'put',
      url: `${base_url}//markasread/${userData?.id}`,
      header:header
    }).then(res=>{

    }).catch(err=>{

    });
  }

  //initialize the call
  useEffect(() => {
    userstatus(navigate, header);
    markasread();
  }, []);

  //to call api continuously
  useEffect(() => {
    !userData?.id && navigate('/home')
    setTimeout(() => {
      continuousAPI();
    }, 1000);
  }, [count])

  //UseEffect to scroll end
  useEffect(() => {
    chat?.length !== 0 && document.getElementById('chatDiv')?.scrollTo(0, document.getElementById('chatDiv')?.scrollHeight);
  }, [scroll])

  // console.log(document.getElementById(`date${chat.length}`)?.scrollHeight)

  return (
    <div className='container'>
      {loadingFunc(loading)}
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
                  <div className='col-7'></div> {/* send */}
                  <div className='col-5'>
                    <div className='d-flex flex-row-reverse '>
                      <div className='border border-primary rounded p-2'>{data?.message}</div>
                    </div>
                    <div className='text-right small '> <span dangerouslySetInnerHTML={{ __html: data?.createdAt }} /> {data?.is_read && <i className='fas fa-sm fa-thumbs-up'></i>}</div>
                  </div>
                </>
                :
                <>{data?.from_id == false ?
                  <div className='col-5'>{/* receive */}
                    <div className='d-flex'>
                      <div className='border border-primary rounded p-2'>{data?.message}</div>
                    </div>
                    <div className='small' dangerouslySetInnerHTML={{ __html: data?.createdAt }}></div>

                  </div> : <div id={`date${index+1}`} className='col-10 text-center font-weight-bold '>{data?.date}</div>}</>
              }
            </div>
            // <div className={data?.from_id ? 'd-flex flex-row-reverse mt-2':'mt-2'}>
            //   <div className='border border-primary d-inline-flex p-2 rounded'>{data?.message}</div>
            // </div>
          )}
          {loading ? <div className=" text-secondary text-center">Loading...</div> : chat?.length == 0 && <div className=" text-secondary text-center">Start communication</div>}
        </div>
      </div>
      <div className='mt-2'>
        <form className='input-group' onSubmit={handleSubmit(sendMsg)}>
          <input className='form-control border-secondary' autoComplete='off'
            placeholder='Message here'
            {...register('msg', { required: true })} />
          <button className=' input-group-text p-2 border border-success rounded' type='submit'><i className='fa fa-arrow-right'></i></button>
        </form>
      </div>
    </div>
  )
}

export default Chat