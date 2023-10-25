import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import { base_url, permission, requestPermission, userstatus, showNotification, loadingFunc, webSocketUrl, alert, isMobile } from '../Utils/Utility';
import axios from 'axios';
import { set, useForm } from 'react-hook-form';
import typing_gif from '../Assets/typing.gif';
import '../Style/style.css';
import sendIcon from '../Assets/send.gif';
import sendIcon1 from '../Assets/send.png';
import profile from '../Assets/profile.png';
import back from '../Assets/back.png';
import load from '../Assets/loading.gif';
import img_send from '../Assets/add_img.gif';
import img_static from '../Assets/img_static.png';


function Chat() {
  const location = useLocation();
  const navigate = useNavigate();

  const userData = location.state;
  const [chat, setChat] = useState({ typing: false, message: [] });
  const [scroll, setScroll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingdel, setLoadingdel] = useState({});
  const { register, reset, handleSubmit, getValues } = useForm();
  const [limit, setLimit] = useState(10);
  const [user, setUser] = useState();
  const chatref = useRef({ limit: 10, message: null });
  const [imgFile, setImgFile] = useState();
  const [oneImg, setOneImg] = useState();

  //scroll element
  const divEle = document.getElementById('chatDiv');

  const header = { "Authorization": "bearer " + localStorage.getItem('token') };

  const getUser = async () => {
    const data = await userstatus(navigate, header);
    setUser(data?.data)
  };

  const sendMsg = (data) => {
    if (data.msg !== '') {
      chatref.current.message = {
        to_id: userData?.id,
        message: data.msg
      }
      let temp = chat
      temp.message.push({ from_id: true, message: data.msg, load: true, msg_id: chat.message[chat.message.length - 1].msg_id + 1 });
      setChat(temp);
      setScroll(!scroll)
      reset();
    }
    setTimeout(() => {
      typing(false);
    }, 200);
  }

  const markasread = () => {
    axios({
      method: 'put',
      url: `${base_url}chat/markasread/${userData?.id}`,
      headers: header,
    }).then(res => {

    }).catch(err => {

    });
  }

  const typing = (status, value) => {
    if (!value) {
      status = false;
    }

    axios({
      method: 'put',
      url: `${base_url}chat/typing`,
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

  const deleteMsg = (id, media) => {
    setLoadingdel({ [id]: true });
    axios({
      method: 'delete',
      url: `${base_url}chat/deletemsg/${id}/${media}`,
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
    let temp = JSON.parse(event.data);
    let msg_id = chatref.current?.data?.message?.filter((item) => item?.load == true)[0]?.msg_id;
    if (temp?.message?.filter((item) => item?.msg_id == msg_id)) {
      setChat(temp);
    } else if (!msg_id) {
      setChat(temp);
    }
    setLoading(false);
    chatref.current?.data == undefined && setScroll(true)
  }

  //push notification
  useEffect(() => {
    let tempEle = document.getElementById('first0')
    let temp = chatref.current?.data

    //chek new msg for alert and scroll
    if (temp?.message?.[temp?.message?.length - 1]?.message != chat?.message?.[chat?.message?.length - 1]?.message) {
      if (temp?.message?.length !== 0 && permission === "granted") {
        if (chat?.message?.[chat?.message?.length - 1]?.from_id == false && chat?.message[chat?.message?.length - 1]?.is_read === false) {
          showNotification(`Message from ${userData?.name}`, chat?.message[chat?.message?.length - 1]?.is_media ? "Send an image" : chat?.message[chat?.message?.length - 1]?.message);
        }
      } else if (permission === "default") {
        requestPermission();
      }
      setScroll(!scroll);
    }

    if (chat?.message[chat?.message?.length - 1]?.is_media && chat?.message[chat?.message?.length - 1]?.is_read === false) {
      setTimeout(() => {
        setScroll(!scroll);
      }, 400);
    }

    //align div for prev chat view
    if (temp?.message?.length !== undefined && temp?.message?.length !== chat?.message?.length) {
      limit != 10 && divEle?.scrollTo(0, tempEle.scrollHeight * 5 + 25)
    }


    chatref.current = { ...chatref.current, data: chat }
  }, [chat])

  //websocket event
  useEffect(() => {
    if (user !== undefined) {
      setLoading(true);
      const ws = new WebSocket(`${webSocketUrl}/getchat/${user?.id}?id=${userData?.id}`);

      ws.onopen = () => {
        ws.send(JSON.stringify({ limit: chatref.current.limit, msg: chatref.current.message }))
      }

      ws.onmessage = onmessage

      let interval = setInterval(() => {
        ws.send(JSON.stringify({ limit: chatref.current.limit, msg: chatref.current.message }))
        chatref.current.message && (chatref.current.message = null)
      }, 1000);

      ws.onerror= ()=>{
        clearInterval(interval);
        setLoading(false);
      }

      chatref.current = { ws: ws, interval: interval, ...chatref.current }
    }

    return () => {
      chatref.current?.ws?.close()
      clearInterval(chatref.current?.interval);
    }
  }, [user])

  useEffect(() => {
    if (limit !== chatref.current.limit) {
      chatref.current.limit = limit
    }
  }, [limit])

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
  });

  const selectFile = (e) => {
    if (e.target.files?.length) {
      var allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif)$/i;

      if (!allowedExtensions.exec(e.target.value)) {
        alert("Image files only");
        return;
      }
      if (e.target.files[0].size > 100e5) {
        alert("Large image files");
        return;
      }
      setImgFile({ file: e.target.files[0], url: URL.createObjectURL(e.target.files[0]) });
      document.getElementById('sendbtn').focus();
    } else {
      setImgFile();
    }

  }

  const postImg = () => {
    if (imgFile?.file) {
      setImgFile(pre => ({ ...pre, load: true }))
      const fm = new FormData();
      fm.append('data', JSON.stringify({ to_id: userData?.id }));
      fm.append('source', imgFile?.file);

      axios({
        method: 'POST',
        url: base_url + 'chat/media',
        data: fm,
        headers: header
      }).then((response) => {
        setImgFile();
      }).catch((error) => {
        setImgFile(pre => ({ ...pre, load: false }))
        alert("Failed to send image")
      })
    }
  }

  return (
    <div className='container'>
      {loadingFunc(loading)}
      <div className='border border-info rounded' style={{ backgroundColor: '#ffc77747' }}>
        <div className='d-flex justify-content-between align-items-center' style={{ backgroundColor: '#ade7ff' }}>
          <div className='p-1 d-flex align-items-end'>
            <div className='profile-small mr-2' style={{ backgroundImage: `url(${userData?.profile ? userData?.profile : profile})` }}></div>
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
                      {(loadingdel?.[data?.msg_id] || data?.load) ? <img src={load} width={30} /> : <i className='fa fa-trash fa-sm messagedel' onClick={() => deleteMsg(data?.msg_id, data?.is_media ? data?.message : 0)}></i>}
                      <div className='border border-primary rounded p-2 messagetext1'>
                        {data?.is_media ?
                          <img src={base_url + "/media/" + data?.message}
                            onl
                            alt='No img'
                            data-toggle="modal"
                            data-target="#exampleModal"
                            style={{ cursor: 'pointer' }}
                            width={80} onClick={() => setOneImg(base_url + "/media/" + data?.message)} /> :
                          data?.message
                        }
                      </div>
                    </div>
                    <div className='text-right small msgtime1'> <span dangerouslySetInnerHTML={{ __html: data?.createdAt }} /> {data?.is_read && <i className='fas fa-sm fa-thumbs-up'></i>}</div>
                  </div>
                </>
                :
                <>{data?.from_id == false ?
                  <div className='col-10 pl-2'>{/* receive */}
                    <div className='d-flex'>
                      <div className='border border-success rounded p-2 messagetext2'>
                        {data?.is_media ?
                          <img src={base_url + "/media/" + data?.message}
                            alt='No img'
                            data-toggle="modal"
                            data-target="#exampleModal"
                            style={{ cursor: 'pointer' }}
                            width={80} onClick={() => setOneImg(base_url + "/media/" + data?.message)} /> :
                          data?.message
                        }
                      </div>
                    </div>
                    <div className='small msgtime2' dangerouslySetInnerHTML={{ __html: data?.createdAt }}></div>

                  </div> : <div className='col-10 offset-1 text-center font-weight-bold' style={{ color: 'chocolate' }}>{data?.date}</div>}</>
              }
            </div>
          )}
          {loading ? <div className=" text-secondary text-center">Loading...</div> : (chat?.message?.length <= 1) && <div className="text-dark text-center">Say Hi to <span className='text-capitalize'>{userData?.name}</span></div>}
          {chat?.typing && <img src={typing_gif} width={30} />}
        </div>
      </div>

      {/* Input message */}
      <div className='mt-2'>
        <form className='d-flex align-items-center' onSubmit={handleSubmit(imgFile ? postImg : sendMsg)}>
          <button type='button' className='btn btn-link' title='choose media' onClick={() => document.getElementById('fileSource').click()}>
            <img src={img_static} width={35} />
          </button>
          <input id="fileSource" type='file' onChange={(e) => { selectFile(e) }} style={{ display: 'none' }} accept='.jpg,.jpeg,.png' />
          <input className='form-control border-secondary p-1' autoComplete='off'
            placeholder='Message here'
            {...register('msg', { onChange: (e) => typing(true, e.target.value), onBlur: () => typing(false) })} />

          {imgFile?.url &&
            // <div className='ml-2 d-flex imgDiv' >
            //   <i className='fa fa-plus fa-sm plus text-danger font-weight-bold'></i>
            <img className='ml-2 selImg' src={imgFile?.url} width={35} title='remove' onClick={() => setImgFile()} />
            // </div>
          }
          {imgFile?.load ? <img src={load} width={40} /> :
            <button className='btn btn-link' type='submit' id='sendbtn' title='Send'>
              {getValues('msg') ? <img src={sendIcon} width={35} /> : <img src={sendIcon1} width={35} />}
            </button>}
        </form>
      </div>
      {/* Modal */}
      <div className="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered model-lg ">
          <div className="modal-content bg-dark">
            <div className='model-header'>
              <button type="button" className="close px-2" data-dismiss='modal' aria-label="Close" style={{ color: 'white' }}>
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body" >
              <div style={{ overflow: 'auto' }}>
                <img src={oneImg} width={isMobile ? 350 : 760} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chat