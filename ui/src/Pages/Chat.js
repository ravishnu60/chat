import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import { base_url, permission, requestPermission, userstatus, showNotification, loadingFunc } from '../Utils/Utility';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { useIdleTimer } from 'react-idle-timer';
import typing_gif from '../Assets/typing.gif'

function Chat() {
  const location = useLocation();
  const navigate = useNavigate();

  const userData = location.state;
  const [chat, setChat] = useState();
  const [scroll, setScroll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(false); //for continuous call
  const { register, reset, handleSubmit } = useForm();
  const [limit, setLimit] = useState(10);
  // const [preload, setPreload] = useState(false);

  //scroll element
  const divEle = document.getElementById('chatDiv');

  const header = { "Authorization": "bearer " + localStorage.getItem('token') };

  const continuousAPI = () => {
    let tempEle= document.getElementById('first0')
    axios({
      method: 'get',
      url: `${base_url}/pastchat?id=${userData?.id}&limit=${limit}`,
      headers: header
    }).then((res) => {
      let temp = res?.data?.data;
      //chek new msg for alert and scroll
      if (chat?.message?.length !== undefined && chat?.message?.[chat?.message?.length - 1]?.message != temp?.message?.[temp?.message?.length - 1]?.message) {
        if (permission === "granted") {
          if (temp?.message?.[temp?.message?.length - 1]?.from_id == false) {
            showNotification(`Message from ${userData?.name}`, temp?.message[temp?.message?.length - 1]?.message);
          }
        } else if (permission === "default") {
          requestPermission();
        }
        setScroll(!scroll);
      }
      //align div for prev chat view
      if (chat?.message?.length !== undefined && chat?.message?.length !== temp?.message?.length) {
        limit != 10 && divEle?.scrollTo(0,tempEle.scrollHeight*5+25)
      }
      chat == undefined && setScroll(true);
      setChat(temp);
      setCount(!count);
      setTimeout(() => {
        setLoading(false);
      }, 200);
    }).catch((err) => {
      userstatus(navigate, header);
      setChat();
      setCount(!count);
      setLoading(false);
    })
  }

  const sendMsg = (data) => {
    setTimeout(() => {
      typing(false);
    }, 200);
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

  const markasread = () => {
    axios({
      method: 'put',
      url: `${base_url}/markasread/${userData?.id}`,
      headers: header,
    }).then(res => {

    }).catch(err => {

    });
  }

  const typing = (status, val) => {
    if (!val) {
      status = false;
    }
    axios({
      method: 'put',
      url: `${base_url}/typing`,
      data: { to_id: userData?.id, typing: status },
      headers: header
    }).then(res => {
      // console.log(res.data);
    }).catch(err => { });
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
    chat?.message?.length !== 0 && divEle?.scrollTo(0, divEle?.scrollHeight);
  }, [scroll, chat?.typing == true])

  // console.log(document.getElementById(`date${chat.length}`)?.scrollHeight)

  divEle?.addEventListener('scroll', () => {
    console.log(divEle.scrollTop + divEle.offsetHeight, divEle.scrollHeight);
    if (divEle?.scrollTop == 0) {
      setLimit(limit + 5);
      setLoading(true);
    }
    divEle.scrollTop + divEle.offsetHeight == divEle?.scrollHeight && setLimit(10)
  })

  return (
    <div className='container'>
      {loadingFunc(loading)}
      <div className='border border-info rounded'>
        <div className='d-flex justify-content-between align-items-center p-2 bg-info text-light'>
          <h4>{userData?.name}</h4>
          <button className='btn text-right' onClick={() => { navigate('/home') }}><i className='fa fa-arrow-left'> </i></button>
        </div>
        <div id="chatDiv" className='p-2' style={{ maxHeight: '60vh', overflowX: 'hidden', overflowY: 'auto' }}>
          {chat?.message?.map((data, index) =>
            <div className='row p-3' key={index} id={`first${index}`}>
              {data?.from_id ?
                <>
                  <div className='col-5'></div> {/* send */}
                  <div className='col-7'>
                    <div className='d-flex flex-row-reverse '>
                      <div className='border border-primary rounded p-2'>{data?.message}</div>
                    </div>
                    <div className='text-right small '> <span dangerouslySetInnerHTML={{ __html: data?.createdAt }} /> {data?.is_read && <i className='fas fa-sm fa-thumbs-up'></i>}</div>
                  </div>
                </>
                :
                <>{data?.from_id == false ?
                  <div className='col-7'>{/* receive */}
                    <div className='d-flex'>
                      <div className='border border-primary rounded p-2'>{data?.message}</div>
                    </div>
                    <div className='small' dangerouslySetInnerHTML={{ __html: data?.createdAt }}></div>

                  </div> : <div className='col-10 offset-1 text-center font-weight-bold '>{data?.date}</div>}</>
              }
            </div>
          )}
          {loading ? <div className=" text-secondary text-center">Loading...</div> : chat == undefined && <div className=" text-secondary text-center">Start communication</div>}
          {chat?.typing && <img src={typing_gif} width={30} />}
        </div>
      </div>
      <div className='mt-2'>
        <form className='input-group' onSubmit={handleSubmit(sendMsg)}>
          <input className='form-control border-secondary' autoComplete='off'
            placeholder='Message here'
            {...register('msg', { required: true, onChange: (e) => { typing(true, e.target.value) }, onBlur: () => { typing(false) } })} />
          <button className=' input-group-text p-2 border border-success rounded' type='submit'><i className='fa fa-arrow-right'></i></button>
        </form>
      </div>
    </div>
  )
}

export default Chat