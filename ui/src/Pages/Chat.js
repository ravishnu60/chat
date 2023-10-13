import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import { base_url, permission, requestPermission, userstatus, showNotification, loadingFunc, webSocketUrl } from '../Utils/Utility';
import axios from 'axios';
import { set, useForm } from 'react-hook-form';
import typing_gif from '../Assets/typing.gif';
import '../Style/style.css';
import sendIcon from '../Assets/send.gif';
import sendIcon1 from '../Assets/send.png';
import profile from '../Assets/profile.png';
import back from '../Assets/back.png';
import load from '../Assets/loading.gif';


function Chat() {
  const location = useLocation();
  const navigate = useNavigate();

  const userData = location.state;
  const [chat, setChat] = useState();
  const [scroll, setScroll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingdel, setLoadingdel] = useState({});
  const [count, setCount] = useState(false); //for continuous call
  const { register, reset, handleSubmit, getValues } = useForm();
  const [limit, setLimit] = useState(10);
  const [user, setUser] = useState();
  const chatref= useRef({limit:10})

  // const [preload, setPreload] = useState(false);

  //scroll element
  const divEle = document.getElementById('chatDiv');

  const header = { "Authorization": "bearer " + localStorage.getItem('token') };

  const getUser = async () => {
    const data = await userstatus(navigate, header);
    setUser(data?.data)
  };

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

  // const markasread = () => {
  //   axios({
  //     method: 'put',
  //     url: `${base_url}/markasread/${userData?.id}`,
  //     headers: header,
  //   }).then(res => {

  //   }).catch(err => {

  //   });
  // }

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
    }).catch(err => { });
  }

  const delay = (setval) => {
    setTimeout(() => {
      setval({});
    }, 500);
  }

  const deleteMsg = (id) => {
    setLoadingdel({ [id]: true });
    axios({
      method: 'delete',
      url: `${base_url}/deletemsg/${id}`,
      headers: header
    }).then((response) => {
      //removed
      delay(setLoadingdel);
    }).catch((error) => {
      alert('Error while deleting');
      delay(setLoadingdel);
    })
  }

  //initialize the call
  useEffect(() => {
    !userData?.id && navigate('/home')
    getUser()
    // markasread();
  }, []);


  const onmessage = (event) => {
    setLoading(false);
    setChat(JSON.parse(event.data));

  }

  useEffect(() => {
    let tempEle = document.getElementById('first0')
    let temp= chatref.current?.data

      //chek new msg for alert and scroll
      if (temp?.message?.length !== undefined && temp?.message?.[temp?.message?.length - 1]?.message != chat?.message?.[chat?.message?.length - 1]?.message) {
        if (permission === "granted") {
          if (chat?.message?.[chat?.message?.length - 1]?.from_id == false) {
            showNotification(`Message from ${userData?.name}`, chat?.message[chat?.message?.length - 1]?.message);
          }
        } else if (permission === "default") {
          requestPermission();
        }
        setScroll(!scroll);
      }
      //align div for prev chat view
      if (temp?.message?.length !== undefined && temp?.message?.length !== chat?.message?.length) {
        limit != 10 && divEle?.scrollTo(0, tempEle.scrollHeight * 5 + 25)
      }
      chatref.current?.data == undefined && setTimeout(() => {
        setScroll(true)
      }, 70);
    
      chatref.current = { ...chatref.current, data: chat }
  }, [chat])

  //websocket event
  useEffect(() => {
    if (user !== undefined) {
      setLoading(true);
      const ws = new WebSocket(`${webSocketUrl}/getchat/${user?.id}?id=${userData?.id}`);

      ws.onopen = () => {
        ws.send(chatref.current.limit)
      }

      ws.onmessage = onmessage

      let interval = setInterval(() => {
        ws.send(chatref.current.limit)
      }, 2500);

      chatref.current = { ws: ws, interval: interval, ...chatref.current }
    }

    return () => {
      chatref.current?.ws?.close()
      clearInterval(chatref.current?.interval)
    }
  }, [user])

  useEffect(()=>{
    if(limit!== chatref.current.limit){
      chatref.current.limit=limit
    }
  },[limit])

  //UseEffect to scroll end
  useEffect(() => {
    chat?.message?.length !== 0 && divEle?.scrollTo(0, divEle?.scrollHeight);
  }, [scroll, chat?.typing == true])

  divEle?.addEventListener('scroll', () => {
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
        <div className='d-flex justify-content-between align-items-center' style={{ backgroundColor: '#ade7ff' }}>
          <div className='p-1 d-flex align-items-end'>
            <div className='profile-small mr-2' style={{ backgroundImage: `url(${profile})` }}></div>
            <div className='h6'>{userData?.name} </div></div>
          <button className='btn btn-link p-0' title='Back' onClick={() => { navigate('/home') }}>
            <img src={back} width={35} />
          </button>

        </div>
        <div id="chatDiv" className='p-2' style={{ maxHeight: '65vh', overflowX: 'hidden', overflowY: 'auto' }}>
          {chat?.message?.length !== 1 && chat?.message?.map((data, index) =>
            <div className='row p-2' key={index} id={`first${index}`}>
              {data?.from_id ?
                <>
                  <div className='col-2'></div> {/* send */}
                  <div className='col-10 pr-2'>
                    <div className='d-flex flex-row-reverse align-items-center'>
                      {loadingdel?.[data?.msg_id] ? <img src={load} width={30} /> : <i className='fa fa-trash fa-sm messagedel' onClick={() => deleteMsg(data?.msg_id)}></i>}
                      <div className='border border-primary rounded p-2 messagetext1'>{data?.message}</div>
                    </div>
                    <div className='text-right small msgtime1'> <span dangerouslySetInnerHTML={{ __html: data?.createdAt }} /> {data?.is_read && <i className='fas fa-sm fa-thumbs-up'></i>}</div>
                  </div>
                </>
                :
                <>{data?.from_id == false ?
                  <div className='col-10 pl-2'>{/* receive */}
                    <div className='d-flex'>
                      <div className='border border-success rounded p-2 messagetext2'>{data?.message}</div>
                    </div>
                    <div className='small msgtime2' dangerouslySetInnerHTML={{ __html: data?.createdAt }}></div>

                  </div> : <div className='col-10 offset-1 text-center font-weight-bold' style={{ color: 'chocolate' }}>{data?.date}</div>}</>
              }
            </div>
          )}
          {loading ? <div className=" text-secondary text-center">Loading...</div> : (chat?.message?.length == 1 || !chat?.message) && <div className="text-dark text-center">Say Hi to <span className='text-capitalize'>{userData?.name}</span></div>}
          {chat?.typing && <img src={typing_gif} width={30} />}
        </div>
      </div>
      {/* Input message */}
      <div className='mt-2'>
        <form className='d-flex align-items-center' onSubmit={handleSubmit(sendMsg)}>
          <input className='form-control border-secondary p-1' autoComplete='off'
            placeholder='Message here' onFocus={(e)=>typing(true, e.target.value)}
            {...register('msg', { required: true, onBlur: () => { typing(false) } })} />
          <button className='btn btn-link' type='submit' title='Send'>
            {getValues('msg') ? <img src={sendIcon} width={35} /> : <img src={sendIcon1} width={35} />}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Chat