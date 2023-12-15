import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import { base_url, permission, requestPermission, userstatus, showNotification, loadingFunc, webSocketUrl, alert, isMobile } from '../Utils/Utility';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import typing_gif from '../Assets/typing.gif';
import '../Style/style.css';
import sendIcon1 from '../Assets/send.png';
import profile from '../Assets/profile.png';
import back from '../Assets/back.png';
import load from '../Assets/loading.gif';
import img_static from '../Assets/img_static.png';
import EmojiPicker from 'emoji-picker-react';
import reply from '../Assets/reply.png'
import { emojis, url } from '../Utils/emojis';
import uEmojiParser from 'universal-emoji-parser'

function Chat({props}) {
  const {user, to, loading, setLoading, setTo, viewProfile}= props;

  const [chat, setChat] = useState({ typing: false, message: [] });
  const [scroll, setScroll] = useState(false);
  const [loadingdel, setLoadingdel] = useState({});
  const { register, reset, handleSubmit, getValues, setValue } = useForm();
  const [limit, setLimit] = useState(20);
  const chatref = useRef({ limit: 20, message: null });
  const [imgFile, setImgFile] = useState();
  const [oneImg, setOneImg] = useState();
  const [emoji, setEmoji] = useState({ click: false, size: '70vh' });
  const [anime, setAnime] = useState({ name: null, start: Number(0) })
  const [pin, setPin] = useState({ id: null, msg: null })
  const [restartScoket, setRestartSocket] = useState(false)

  //scroll element
  const divEle = document.getElementById('chatDiv');

  const header = { "Authorization": "bearer " + sessionStorage.getItem('token') };

  const sendMsg = (data) => {
    if (data.msg !== '') {
      chatref.current.message = {
        to_id: to?.user_id,
        message: data.msg,
        is_media: data?.is_media ? data.is_media : false,
        pin: pin.id ? JSON.stringify({ id: pin.id, media: pin?.is_media }) : null
      }
      let temp = chat
      temp.message.push({ from_id: true, message: data.msg, load: true, msg_id: chat.message[chat.message.length - 1].msg_id + 1, is_media: data?.is_media ? data.is_media : false });
      setChat(temp);
      setTimeout(() => {
        setScroll(!scroll)
      }, 200);
      reset();
      setEmoji({ click: false, size: '70vh' });
      cancenAnimi();
      setPin({ id: null, msg: null })
    }
    setTimeout(() => {
      typing(false);
    }, 200);
  }

  const typing = (status, value, focus) => {
    if (value?.length < 2 || status == false || focus) {
      if (!value || value?.length == 0) {
        status = false;
      }
      axios({
        method: 'put',
        url: `${base_url}chat/typing`,
        data: { to_id: to?.user_id, typing: status },
        headers: header
      }).then(res => {
      }).catch(err => { });
    }
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
      url: `${base_url}chat/deletemsg/${id}`,
      headers: header
    }).then(() => {
      //removed
      delay(setLoadingdel);
    }).catch(() => {
      alert('Error while deleting');
      delay(setLoadingdel);
    })
  }

  const onmessage = (event) => {
    let temp = JSON.parse(event.data);
    let msg_id = chatref.current?.data?.message?.filter((item) => item?.load == true)[0]?.msg_id;
    if (temp?.message?.filter((item) => item?.msg_id == msg_id)) {
      setChat(temp);
    } else if (!msg_id) {
      setChat(temp);
    }
  }

  //push notification
  useEffect(() => {
    let tempEle = document.getElementById('first0')
    let temp = chatref.current?.data

    //chek new msg for alert and scroll
    if (temp?.message?.[temp?.message?.length - 1]?.message != chat?.message?.[chat?.message?.length - 1]?.message) {
      if (temp?.message?.length !== 0 && permission === "granted" && document.visibilityState == 'hidden') {
        if (chat?.message?.[chat?.message?.length - 1]?.from_id == false && chat?.message[chat?.message?.length - 1]?.is_read === false) {
          showNotification(`Message from ${to?.name}`, chat?.message[chat?.message?.length - 1]?.is_media ? "Send an image" : chat?.message[chat?.message?.length - 1]?.message);
        }
      } else if (permission === "default") {
        requestPermission();
      }
      setScroll(!scroll);
    }

    !chatref.current?.data?.message?.length && setTimeout(() => {
      setScroll(!scroll);
      setTimeout(() => {
        setScroll(!scroll);
      }, 950);
    }, 500);

    //align div for prev chat view
    if (temp?.message?.length !== undefined && temp?.message?.length !== chat?.message?.length) {
      limit != 20 && setTimeout(() => {
        divEle?.scrollTo(0, tempEle.scrollHeight * 5 + 25)
      }, 50);
    }
    chatref.current = { ...chatref.current, data: chat }
    setLoading(false);
  }, [chat])

  const wsErrorHandler = () => {
    chatref.current?.ws.close();
    clearInterval(chatref.current?.interval);
    setTimeout(() => {
      setRestartSocket(!restartScoket);
    }, 15000);
  }

  //websocket event
  useEffect(() => {
    setLoading(true)
    if (user !== undefined) {
      const ws = new WebSocket(`${webSocketUrl}/getchat/${user?.id}?id=${to?.user_id}`);

      ws.onopen = () => {
        ws?.send(JSON.stringify({ limit: chatref.current.limit, msg: null }))
      }

      ws.onmessage = onmessage
      ws.onerror = wsErrorHandler

      let interval = setInterval(() => {
        try {
          ws?.send(JSON.stringify({ limit: chatref.current.limit, msg: chatref.current.message }))
          chatref.current.message && (chatref.current.message = null)
        } catch {
          wsErrorHandler();
        }
      }, 1000);

      ws.onerror = () => {
        clearInterval(interval);
        setLoading(false);
        ws.close();
      }

      chatref.current = { ws: ws, interval: interval, ...chatref.current }
    }

    return () => {
      setChat({ typing: false, message: [] })
      chatref.current?.ws?.close()
      clearInterval(chatref.current?.interval);
      chatref.current={ limit: 20, message: null };
    }
  }, [to, restartScoket])

  useEffect(() => {
    if (limit !== chatref.current.limit) {
      chatref.current.limit = limit
    }
  }, [limit])

  //UseEffect to scroll end
  useEffect(() => {
    chat?.message?.length !== 0 && divEle?.scrollTo(0, divEle?.scrollHeight);
  }, [scroll, chat?.typing == true, emoji, pin])

  divEle?.addEventListener('scroll', () => {
    if (divEle?.scrollTop == 0) {
      setLimit(limit + 10);
      setLoading(true);
    }
    divEle.scrollTop + divEle.offsetHeight == divEle?.scrollHeight && setLimit(20)
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
      cancenAnimi();
    } else {
      setImgFile();
    }

  }

  const postImg = () => {
    if (imgFile?.file) {
      setImgFile(pre => ({ ...pre, load: true }))
      const fm = new FormData();
      fm.append('data', JSON.stringify({ to_id: to?.user_id }));
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

  const cancenAnimi = () => {
    setAnime({ name: null, start: 0 });
    setEmoji(pre => ({ ...pre, size: '70vh' }));
  }

  const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/;

  const constructText = (text) => {
    let temp = text.split(' ')
    return temp?.map((value, index) => <span key={index}>{urlRegex.test(value) ? <a target='_blank' href={value}>{value}</a> : <>{value+' '}</>}</span>);
  }

  const getEmoji =(name) =>{
    return uEmojiParser.parse(`:${name.toLowerCase().split(' ').join('_')}:`, { parseToHtml: false, parseToUnicode: true });
  }

  return (
    <div className='container'>
      <div className='border border-info rounded'>
        <div className='d-flex justify-content-between align-items-center' style={{ backgroundColor: '#90ffcc' }}>
          <div className='p-1 d-flex align-items-center'>
            <div>
              <img
                className='profile-small mr-2' id="profileimg"
                style={{ cursor: 'pointer' }}
                src={to?.profile ? to?.profile : profile}
                onError={() => document.getElementById("profileimg").src = profile}
                onClick={() => to?.profile && viewProfile(to?.profile) } />
              </div>
            <div >
              <div className='h6 mb-0 font-weight-bold'>{to?.name} </div>
              <div className={`small font-weight-bold ${chat?.message?.[chat?.message?.length - 1]?.alive ? 'text-success' : 'text-secondary'}`}>{chat?.message?.[chat?.message?.length - 1]?.alive ? 'online' : chat?.message?.[chat?.message?.length - 1]?.last_seen}</div>
            </div>
          </div>
          <button className='btn btn-link p-0' title='Back' onClick={() => { setTo()}}>
            <img src={back} width={35} alt='back' />
          </button>
        </div>
        <div id="chatDiv" className='p-2 text-light' style={{ minHeight: emoji.size, maxHeight: emoji.size, overflowX: 'hidden', overflowY: 'auto' }}>
          {chat?.message?.length !== 1 && chat?.message?.map((data, index) =>
            <div className='row p-2' key={index} id={`first${index}`}>
              {data?.from_id ?
                <>
                  <div className='col-2'></div> {/* send */}
                  <div className='col-10 pr-2'>
                    <div className='d-flex flex-row-reverse align-items-center' >
                      {(loadingdel?.[data?.msg_id] || data?.load) ? <img src={load} width={30} /> : <i className='fa fa-trash fa-sm messagedel' onClick={() => deleteMsg(data?.msg_id)}></i>}
                      <div className='border border-primary rounded' id={`msg_id${data?.msg_id}`}>
                        {data?.pin?.msg && <div className='border border-warning senderPin px-1' style={{ fontSize: '13px', cursor: 'pointer' }} onClick={() => document.getElementById(`msg_id${data?.pin?.id}`)}>
                          {data?.pin?.media ? <img src={data?.pin?.msg} width={30} alt='deleted' /> : data?.pin?.msg}
                        </div>}
                        {data?.is_media ?
                          <>
                            {(data.message.includes(url) && isMobile) ?
                              <div children className='p-1 small'>{getEmoji(data.message.split('/')[data.message.split('/')?.length - 1].split('.')[0])}</div >
                              :
                              <img src={data?.message}
                                title='file'
                                alt='No image'
                                data-toggle="modal" data-target={!data.message.includes(url) && "#pic_view"}
                                style={{ cursor: 'pointer' }}
                                width={data.message.includes(url) ? 50 : 120} onClick={() => setOneImg(data?.message)} />
                            }
                          </> :
                          <div className={'p-2 sender text-break '+(isMobile ? 'small':'')}>{constructText(data?.message)} </div>
                        }
                      </div>
                      <img src={reply} width={20} style={{ opacity: '0.5', cursor: 'pointer' }} onClick={() => (document.getElementById('msg_input').focus(), setPin({ id: data?.msg_id, msg: data.message, is_media: data?.is_media }))} />
                    </div>
                    <div className='text-right small msgtime1'> <span dangerouslySetInnerHTML={{ __html: data?.createdAt }} /> {data?.is_read && <i className='fas fa-sm fa-thumbs-up'></i>}</div>
                  </div>
                </>
                :
                <>{data?.from_id == false ?
                  <div className='col-10 pl-2'>{/* receive */}
                    <div className='d-flex'>
                      <div className='border border-success rounded'>
                        {data?.pin?.msg && <div className='border border-warning messagetext3 text-secondary px-1' style={{ fontSize: '14px', cursor: 'pointer' }} onClick={() => document.getElementById(`msg_id${data?.pin?.id}`)?.focus()}>
                          {data?.pin?.media ? <img src={data?.pin?.msg} width={30} alt='deleted' /> : data?.pin?.msg}
                        </div>}
                        {data?.is_media ?
                          <> {(data.message.includes(url) && isMobile) ?
                            <div children className='p-1 small'>{getEmoji(data.message.split('/')[data.message.split('/')?.length - 1].split('.')[0])}</div > 
                            :
                            <img src={data.message}
                              title='file'
                              alt='No image'
                              data-toggle="modal" data-target="#pic_view"
                              style={{ cursor: 'pointer' }}
                              width={data.message.includes(url) ? 50 : 120} onClick={() => setOneImg(data?.message)} />}
                          </> :
                          <div className={'p-2 receiver text-break '+(isMobile ? 'small':'')}> {constructText(data?.message)} </div>
                        }
                      </div>
                      <div>
                        <img src={reply} width={20} style={{ opacity: '0.5', cursor: 'pointer' }} onClick={() => (document.getElementById('msg_input').focus(), setPin({ id: data?.msg_id, msg: data.message, is_media: data?.is_media }))} />
                      </div>
                    </div>
                    <div className='small msgtime2' dangerouslySetInnerHTML={{ __html: data?.createdAt }}></div>

                  </div> : <div className='col-10 offset-1 text-center font-weight-bold' style={{ color: 'chocolate' }}>{data?.date}</div>}</>
              }
            </div>
          )}
          {loading ? <div className=" text-secondary text-center">Loading...</div> : (chat?.message?.length <= 1) && <div className="text-light text-center">Say Hi to <span className='text-capitalize'>{to?.name}</span></div>}
          {chat?.typing && <img src={typing_gif} width={40} alt='typing' />}
          {pin.id &&
            <div className='row'>
              <div className='col-11 pr-2'>
                <div className='d-flex flex-row-reverse align-items-center'>
                  <div className='border border-primary rounded p-2 messagetext3'>
                    {pin?.is_media ? <img src={pin?.msg} width={30} /> : pin?.msg}
                    <button type="button" className="close px-2" data-dismiss='modal' aria-label="Close" onClick={() => setPin({ id: null, msg: null })}>
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      {/* Input message */}

      <div className='mt-2'>
        <form className='d-flex align-items-center' onSubmit={handleSubmit(imgFile ? postImg : sendMsg)}>
          <button type='button' className='btn btn-link p-1 mr-1' title='choose media' onClick={() => { document.getElementById('fileSource').click() }}>
            <img src={img_static} width={28} alt='select image' />
          </button>
          <button type='button' className='btn btn-link p-1' onClick={() => { setAnime({ name: null, start: Number(0) }); setEmoji(pre => ({ click: !pre.click, size: pre.click ? '70vh' : '30vh' })); }}><i className='far fa-smile fa-lg'></i></button>
          {!isMobile && <button type='button' className='btn btn-link p-1' title='choose media' onClick={() => { setEmoji({ click: false, size: anime.name ? '70vh' : '42vh' }); setAnime(pre => ({ ...pre, name: pre.name ? null : 'Smileys' })); }}>
            <img src='https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Relieved Face.webp' width={28} alt='select image' />
          </button>}
          <input id="fileSource" type='file' onChange={(e) => { selectFile(e) }} style={{ display: 'none' }} accept='.jpg,.jpeg,.png' />
          <input id="msg_input" type='text' style={{ borderRadius: '20px' }} className={`form-control border-secondary p-1 ${isMobile ? "h-50" : ''}`} autoComplete='off'
            placeholder='Message here' onFocus={() => typing(true, getValues('msg'), true)}
            {...register('msg', { onChange: (e) => typing(true, e.target.value), onBlur: () => typing(false) })} />

          {imgFile?.url &&
            // <div className='ml-2 d-flex imgDiv' >
            //   <i className='fa fa-plus fa-sm plus text-danger font-weight-bold'></i>
            <img className='ml-2 selImg' alt='selected' src={imgFile?.url} width={35} title='remove' onClick={() => setImgFile()} />
            // </div>
          }
          {imgFile?.load ? <img src={load} width={38} alt='load' /> :
            <button className='btn btn-link p-1 ml-2' type='submit' id='sendbtn' title='Send'>
              <img src={sendIcon1} width={28} alt='send' />
            </button>}
        </form>
        {emoji.click && <div>
          <EmojiPicker autoFocusSearch={false} onEmojiClick={(e) => {setValue("msg", getValues('msg') + e.emoji); document.getElementById('sendbtn').focus(); }} previewConfig={{ showPreview: false }} height="47vh" width={"100%"} />
        </div>}
      </div>

      {/* Animate Emojiii */}
      {
        anime?.name &&
        <>
          <div className="mt-1 row col-lg-10 col-12 ">
            <div className='d-flex overflow-auto'>
              {Object.keys(emojis).map((name, index) =>
                <span key={index} className={`btn btn-sm text-nowrap ${name == anime.name && "btn-primary"}`}
                  onClick={() => {
                    setAnime({ start: 0, name: null }); setTimeout(() => {
                      setAnime({ start: 0, name: name })
                    }, 50);
                  }} >{name}</span>
              )}
            </div>
          </div>
          <div className='row col-lg-10 col-12 border border-primary my-1' />
          <div className='row col-lg-10 col-12 d-flex justify-content-between'>
            <i className='btn fa fa-arrow-left p-0' title='pre' onClick={() => anime.start > 0 && setAnime(pre => ({ ...pre, start: pre.start - (isMobile ? 15 : 30) }))}></i>
            <i className='btn fa fa-arrow-right p-0' title='next' onClick={() => emojis[anime.name]?.length - anime.start > (isMobile ? 15 : 30) && setAnime(pre => ({ ...pre, start: pre.start + 30 }))}></i>
          </div>
          <div className='row col-lg-10 col-12 mt-1' style={{ maxHeight: '20vh', overflow: 'auto' }}>
            {emojis[anime.name]?.map((item, index) => {
              return (index < anime.start + (isMobile ? 15 : 30) && index >= anime.start) && <div key={index} className=' border border-warning rounded text-center ml-1 mb-1'>
                <img style={{ cursor: 'pointer' }} src={`${url}/${anime.name}/${item}`} alt='no' width={isMobile ? 25 : 50} onClick={() => sendMsg({ msg: `${url}/${anime.name}/${item}`, is_media: true })} />
              </div>
            }
            )}
          </div>
        </>
      }

      {/* Modal */}
      <div className="modal fade" id="pic_view" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
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
    </div >
  )
}

export default Chat