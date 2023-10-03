import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import { base_url, permission, requestPermission, userstatus, showNotification, loadingFunc } from '../Utils/Utility';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import typing_gif from '../Assets/typing.gif';
import '../Style/style.css';
import sendIcon from '../Assets/send.gif';
import sendIcon1 from '../Assets/send.png';

function Chat() {
  const location = useLocation();
  const navigate = useNavigate();

  const userData = location.state;
  const [chat, setChat] = useState();
  const [scroll, setScroll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(false); //for continuous call
  const { register, reset, handleSubmit, getValues } = useForm();
  const [limit, setLimit] = useState(10);
  // const [preload, setPreload] = useState(false);

  //scroll element
  const divEle = document.getElementById('chatDiv');

  const header = { "Authorization": "bearer " + localStorage.getItem('token') };

  const continuousAPI = () => {
    let tempEle = document.getElementById('first0')
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
            // showNotification(`Message from ${userData?.name}`, temp?.message[temp?.message?.length - 1]?.message);
          }
        } else if (permission === "default") {
          requestPermission();
        }
        setScroll(!scroll);
      }
      //align div for prev chat view
      if (chat?.message?.length !== undefined && chat?.message?.length !== temp?.message?.length) {
        limit != 10 && divEle?.scrollTo(0, tempEle.scrollHeight * 5 + 25)
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
      <div className='border border-info rounded' style={{ backgroundColor: '#ffc77747' }}>
        <div className='d-flex justify-content-between align-items-center text-light' style={{ backgroundColor: '#ff5586' }}>
          <div className='ml-3 h4'>{userData?.name}</div>
          <button className='btn btn-info text-right' title='Back' onClick={() => { navigate('/home') }}>
            {/* <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" class="bi bi-box-arrow-left" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M6 12.5a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v2a.5.5 0 0 1-1 0v-2A1.5 1.5 0 0 1 6.5 2h8A1.5 1.5 0 0 1 16 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 5 12.5v-2a.5.5 0 0 1 1 0v2z" />
              <path fill-rule="evenodd" d="M.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L1.707 7.5H10.5a.5.5 0 0 1 0 1H1.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3z" />
            </svg> */}
            <i className='fa fa-arrow-left'></i></button>

        </div>
        <div id="chatDiv" className='p-2' style={{ maxHeight: '65vh',maxHeight: '65vh', overflowX: 'hidden', overflowY: 'auto' }}>
          {chat?.message?.map((data, index) =>
            <div className='row p-2' key={index} id={`first${index}`}>
              {data?.from_id ?
                <>
                  <div className='col-5'></div> {/* send */}
                  <div className='col-7'>
                    <div className='d-flex flex-row-reverse '>
                      <div className='border border-primary rounded p-2'>{data?.message}</div>
                    </div>
                    <div className='text-right small text-primary'> <span dangerouslySetInnerHTML={{ __html: data?.createdAt }} /> {data?.is_read && <i className='fas fa-sm fa-thumbs-up'></i>}</div>
                  </div>
                </>
                :
                <>{data?.from_id == false ?
                  <div className='col-7'>{/* receive */}
                    <div className='d-flex'>
                      <div className='border border-success rounded p-2'>{data?.message}</div>
                    </div>
                    <div className='small text-primary' dangerouslySetInnerHTML={{ __html: data?.createdAt }}></div>

                  </div> : <div className='col-10 offset-1 text-center font-weight-bold' style={{ color: 'chocolate' }}>{data?.date}</div>}</>
              }
            </div>
          )}
          {loading ? <div className=" text-secondary text-center">Loading...</div> : chat == undefined && <div className=" text-dark text-center">Say Hi to <span className='text-capitalize'>{userData?.name}</span></div>}
          {chat?.typing && <img src={typing_gif} width={30} />}
        </div>
      </div>
      <div className='mt-2'>
        <form className='d-flex align-items-end' onSubmit={handleSubmit(sendMsg)}>
          <input className='form-control border-secondary p-2 mx-2' autoComplete='off'
            placeholder='Message here'
            {...register('msg', { required: true, onChange: (e) => { typing(true, e.target.value) }, onBlur: () => { typing(false) } })} />
          <button className='btn' style={{rotate:'330deg'}} type='submit' title='Send'>
            {getValues('msg') ? <img src={sendIcon} width={40} /> : <img src={sendIcon1} width={40} />}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Chat