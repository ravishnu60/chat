import React, { useEffect, useRef, useState } from 'react';
import { base_url, permission, requestPermission, userstatus, showNotification, loadingFunc, webSocketUrl, alert, isMobile } from '../Utils/Utility';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import typing_gif from '../Assets/typing.gif';
import '../Style/style.css';
import profile from '../Assets/profile.png';
import back from '../Assets/back.png';
import EmojiPicker from 'emoji-picker-react';
import { emojis, url } from '../Utils/emojis';
import uEmojiParser from 'universal-emoji-parser'

function Chat({ props }) {
  const { user, to, loading, setLoading, setTo, viewProfile } = props;

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

  const imgExtensions = /(\.jpg|\.jpeg|\.png|\.gif)$/i;
  const vidExtensions = /(\.mp4)$/i;

  const sendMsg = (data) => {
    if (data.msg !== '') {
      chatref.current.message = {
        to_id: to?.user_id,
        message: data.msg,
        is_media: data?.is_media ? data.is_media : false,
        pin: pin.id ? JSON.stringify({ id: pin.id, media: pin?.is_media }) : null
      }
      let temp = chat
      temp.message.push({ from_id: true, message: data.msg, load: true, msg_id: chat.message[chat.message.length - 1]?.msg_id ? chat.message[chat.message.length - 1]?.msg_id + 1 : 1, is_media: data?.is_media ? data.is_media : false });
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
      // setScroll(!scroll);
    }

    if (!chatref.current?.data?.message?.length) {
      setTimeout(() => {
        setScroll(!scroll);
        setTimeout(() => {
          setScroll(!scroll);
        }, 950);
      }, 500);
    }

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
      chatref.current = { limit: 20, message: null };
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
  }, [scroll, emoji, pin])

  divEle?.addEventListener('scroll', () => {
    if (divEle?.scrollTop == 0) {
      setLimit(limit + 20);
      setLoading(true);
    }
    divEle.scrollTop + divEle.offsetHeight == divEle?.scrollHeight && setLimit(20)
  });

  const selectFile = (e) => {
    if (e.target.files?.length) {

      if (!imgExtensions.exec(e.target.value) && !vidExtensions.exec(e.target.value)) {
        alert("Image & video files only");
        return;
      }
      if (e.target.files[0].size > 30e6) {
        alert("large file size");
        return;
      }
      setImgFile({ file: e.target.files[0], url: URL.createObjectURL(e.target.files[0]), type: imgExtensions.exec(e.target.value) ? 'image' : 'video' });
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
    return temp?.map((value, index) => <span key={index}>{urlRegex.test(value) ? <a target='_blank' href={value}>{value}</a> : <>{value + ' '}</>}</span>);
  }

  const getEmoji = (name) => {
    return uEmojiParser.parse(`:${name.toLowerCase().split(' ').join('_')}:`, { parseToHtml: false, parseToUnicode: true });
  }

  const new_position = isMobile ? { position: 'fixed', bottom: '25px' } : { position: 'fixed', bottom: '85px' }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-profile">
          <img
            className="profile-small" id="profileimg"
            style={{ cursor: 'pointer' }}
            src={to?.profile ? to?.profile : profile}
            onError={() => document.getElementById("profileimg").src = profile}
            onClick={() => to?.profile && viewProfile(to?.profile)} />
          <div>
            <div className="chat-title-text">{to?.name}</div>
            <div className={`chat-status-text ${chat?.message?.[chat?.message?.length - 1]?.alive ? 'online' : 'offline'}`}>
              {chat?.message?.[chat?.message?.length - 1]?.alive ? 'Online' : chat?.message?.[chat?.message?.length - 1]?.last_seen}
            </div>
          </div>
        </div>
        <button className="chat-action-icon btn btn-link p-0" title="Back" onClick={() => { setTo() }}>
          <img src={back} width={28} alt="back" style={{ filter: "brightness(0.9) invert(1)" }} />
        </button>
      </div>
      <div id="chatDiv" className="p-3 text-light" >
        {chat?.message?.length !== 1 && chat?.message?.map((data, index) =>
          <div className="row px-2 py-1 m-0" key={index} id={`first${index}`}>
            {data?.from_id ?
              <>
                <div className='col-2'></div> {/* send */}
                <div className='col-10 pr-2'>
                  <div className='d-flex flex-row-reverse align-items-center' >
                    {(loadingdel?.[data?.msg_id] || data?.load) ? <i className="fa fa-spinner fa-spin text-secondary" style={{ fontSize: '0.72rem', marginRight: '8px', padding: '0 4px' }}></i> : <i className='fa fa-trash fa-sm messagedel px-1' onClick={() => deleteMsg(data?.msg_id)}></i>}
                    <div className={`${data?.is_media ? '' : 'message-bubble-wrap'}`} id={`msg_id${data?.msg_id}`}>
                      {data?.pin?.msg && <div className='reply-bubble-context sender-reply-context' onClick={() => document.getElementById(`msg_id${data?.pin?.id}`)?.scrollIntoView({ behavior: 'smooth' })}>
                        {data?.pin?.media ? <img src={data?.pin?.msg} width={30} alt='media' /> : data?.pin?.msg}
                      </div>}
                      {data?.is_media ?
                        <>
                          {(data.message.includes(url) && isMobile) ?
                            <div children className='p-1 small'>{getEmoji(data.message.split('/')[data.message.split('/')?.length - 1].split('.')[0])}</div >
                            :
                            data?.message?.includes('.mp4') ?
                              <video src={data?.message}
                                title='file'
                                alt='No Video'
                                controls
                                // autoPlay muted loop
                                data-toggle={!data.message.includes(url) ? "modal" : null}
                                data-target={!data.message.includes(url) ? "#pic_view" : null}
                                style={{ cursor: !data.message.includes(url) ? 'pointer' : 'default' }}
                                width={data.message.includes(url) ? 50 : 120}
                                onClick={() => !data.message.includes(url) && setOneImg(data?.message)} />
                              :
                              <img src={data?.message}
                                title='file'
                                alt='No image'
                                data-toggle={!data.message.includes(url) ? "modal" : null}
                                data-target={!data.message.includes(url) ? "#pic_view" : null}
                                style={{ cursor: !data.message.includes(url) ? 'pointer' : 'default' }}
                                width={data.message.includes(url) ? 50 : 120}
                                onClick={() => !data.message.includes(url) && setOneImg(data?.message)} />
                          }
                        </> :
                        <div className={'p-2 sender text-break ' + (isMobile ? 'small' : '')}>{constructText(data?.message)} </div>
                      }
                    </div>
                    <i className='fa fa-reply message-reply-btn sender-reply' onClick={() => (document.getElementById('msg_input').focus(), setPin({ id: data?.msg_id, msg: data.message, is_media: data?.is_media }))}></i>
                  </div>
                  <div className='text-right small msgtime1'> <span dangerouslySetInnerHTML={{ __html: data?.createdAt }} /> {data?.is_read && <i className='fas fa-sm fa-thumbs-up'></i>}</div>
                </div>
              </>
              :
              <>{data?.from_id == false ?
                <div className='col-10 pl-2'>{/* receive */}
                  <div className='d-flex'>
                    <div className={`${data?.is_media ? '' : 'message-bubble-wrap'}`}>
                      {data?.pin?.msg && <div className='reply-bubble-context receiver-reply-context' onClick={() => document.getElementById(`msg_id${data?.pin?.id}`)?.scrollIntoView({ behavior: 'smooth' })}>
                        {data?.pin?.media ? <img src={data?.pin?.msg} width={30} alt='media' /> : data?.pin?.msg}
                      </div>}
                      {data?.is_media ?
                        <> {(data.message.includes(url) && isMobile) ?
                          <div children className='p-1 small'>{getEmoji(data.message.split('/')[data.message.split('/')?.length - 1].split('.')[0])}</div >
                          :
                          data?.message?.includes('.mp4') ?
                            <video src={data.message}
                              title='file'
                              alt='No video'
                              controls
                              data-toggle={!data.message.includes(url) ? "modal" : null}
                              data-target={!data.message.includes(url) ? "#pic_view" : null}
                              style={{ cursor: !data.message.includes(url) ? 'pointer' : 'default' }}
                              width={data.message.includes(url) ? 50 : 120}
                              onClick={() => !data.message.includes(url) && setOneImg(data?.message)} />
                            :
                            <img src={data.message}
                              title='file'
                              alt='No image'
                              data-toggle={!data.message.includes(url) ? "modal" : null}
                              data-target={!data.message.includes(url) ? "#pic_view" : null}
                              style={{ cursor: !data.message.includes(url) ? 'pointer' : 'default' }}
                              width={data.message.includes(url) ? 50 : 120}
                              onClick={() => !data.message.includes(url) && setOneImg(data?.message)} />}
                        </> :
                        <div className={'p-2 receiver text-break ' + (isMobile ? 'small' : '')}> {constructText(data?.message)} </div>
                      }
                    </div>
                    <div>
                      <i className='fa fa-reply message-reply-btn receiver-reply' onClick={() => (document.getElementById('msg_input').focus(), setPin({ id: data?.msg_id, msg: data.message, is_media: data?.is_media }))}></i>
                    </div>
                  </div>
                  <div className='small msgtime2' dangerouslySetInnerHTML={{ __html: data?.createdAt }}></div>

                </div> : <div className='col-10 offset-1 text-center font-weight-bold' style={{ color: 'chocolate' }}>{data?.date}</div>}</>
            }
          </div>
        )}
        {loading ? <div className=" text-secondary text-center">Loading...</div> : (chat?.message?.length <= 1) && <div className="text-light text-center">Say Hi to <span className='text-capitalize'>{to?.name}</span></div>}
        {chat?.typing && <img src={typing_gif} width={40} alt='typing' />}
        {/* {(chat?.message?.some(msg_data=> msg_data.is_read === false) && !chat?.typing) && <div className='small p-1 rounded-circle text-success bg-dark font-weight-bold' style={new_position}>new</div>} */}
      </div>
      {/* Input message */}

      <div className="chat-input-bar">
        {pin.id &&
          <div className="reply-preview-bar d-flex align-items-center justify-content-between">
            <div className="reply-preview-content text-left">
              <div className="reply-preview-title"><i className="fa fa-reply mr-1"></i> Replying to message</div>
              <div className="reply-preview-text text-truncate">
                {pin?.is_media ? <img src={pin?.msg} width={30} alt="media" /> : pin?.msg}
              </div>
            </div>
            <button type="button" className="reply-preview-closebtn btn btn-link p-1 text-danger" onClick={() => setPin({ id: null, msg: null })}>
              <i className="fa fa-times-circle fa-lg"></i>
            </button>
          </div>
        }
        <form className="d-flex align-items-center" onSubmit={handleSubmit(imgFile ? postImg : sendMsg)}>
          {/* <button type="button" className="chat-action-icon btn btn-link p-1 mr-1" title="choose media" onClick={() => { document.getElementById("fileSource").click() }}>
            <i className="far fa-image fa-lg"></i>
          </button> */}
          <button type="button" className="chat-action-icon btn btn-link p-1" onClick={() => { setAnime({ name: null, start: Number(0) }); setEmoji(pre => ({ click: !pre.click, size: pre.click ? "70vh" : "30vh" })); }}><i className="far fa-smile fa-lg"></i></button>
          {!isMobile && <button type="button" className="chat-action-icon btn btn-link p-1" title="choose media" onClick={() => { setEmoji({ click: false, size: anime.name ? "70vh" : "42vh" }); setAnime(pre => ({ ...pre, name: pre.name ? null : "Smileys" })); }}>
            <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Relieved Face.webp" width={24} alt="select image" />
          </button>}
          <input id="fileSource" type="file" onChange={(e) => { selectFile(e) }} style={{ display: "none" }} accept=".jpg,.jpeg,.png,.mp4" />
          <input id="msg_input" type="text" className="form-control chat-input-field p-2" autoComplete="off"
            placeholder="Message here" onFocus={() => typing(true, getValues("msg"), true)}
            {...register("msg", { onChange: (e) => typing(true, e.target.value), onBlur: () => typing(false) })} />

          {imgFile?.url &&
            <div>
              {imgFile?.type === "image" ?
                <img className="ml-2 selImg" alt="selected" src={imgFile?.url} width={35} title="remove" onClick={() => setImgFile()} /> :
                <video className="ml-2 selImg" alt="selected" autoPlay muted src={imgFile?.url} width={45} title="remove" onClick={() => setImgFile()} />
              }
            </div>
          }
          {imgFile?.load ? <i className="fa fa-spinner fa-spin fa-lg ml-2" style={{ color: '#00ffc6', padding: '8px' }}></i> :
            <button className="chat-send-btn btn btn-link p-1 ml-2" type="submit" id="sendbtn" title="Send">
              <i className="fa fa-paper-plane fa-lg"></i>
            </button>}
        </form>
        {emoji.click && <div>
          <EmojiPicker autoFocusSearch={false} onEmojiClick={(e) => { setValue("msg", getValues("msg") + e.emoji); document.getElementById("sendbtn").focus(); }} previewConfig={{ showPreview: false }} height="47vh" width={"100%"} />
        </div>}
        {anime?.name &&
          <div className="animated-emoji-picker mt-2">
            <div className="animated-emoji-categories d-flex overflow-auto py-1">
              {Object.keys(emojis).map((name, index) =>
                <span key={index} className={`emoji-category-tab ${name === anime.name ? "active-tab" : ""}`}
                  onClick={() => {
                    setAnime({ start: 0, name: null }); setTimeout(() => {
                      setAnime({ start: 0, name: name })
                    }, 50);
                  }} >{name}</span>
              )}
            </div>

            <div className="animated-emoji-navigation d-flex justify-content-between align-items-center py-2 px-1">
              <button type="button" className="btn btn-link p-0 emoji-nav-btn" disabled={anime.start === 0} onClick={() => anime.start > 0 && setAnime(pre => ({ ...pre, start: pre.start - (isMobile ? 15 : 30) }))}>
                <i className="fa fa-chevron-left"></i> Previous
              </button>
              <span className="emoji-page-indicator">Showing {anime.start + 1} - {Math.min(anime.start + (isMobile ? 15 : 30), emojis[anime.name]?.length)} of {emojis[anime.name]?.length}</span>
              <button type="button" className="btn btn-link p-0 emoji-nav-btn" disabled={emojis[anime.name]?.length - anime.start <= (isMobile ? 15 : 30)} onClick={() => emojis[anime.name]?.length - anime.start > (isMobile ? 15 : 30) && setAnime(pre => ({ ...pre, start: pre.start + (isMobile ? 15 : 30) }))}>
                Next <i className="fa fa-chevron-right"></i>
              </button>
            </div>

            <div className="animated-emoji-grid d-flex flex-wrap justify-content-start py-2">
              {emojis[anime.name]?.map((item, index) => {
                return (index < anime.start + (isMobile ? 15 : 30) && index >= anime.start) &&
                  <div key={index} className="animated-emoji-item" onClick={() => sendMsg({ msg: `${url}/${anime.name}/${item}`, is_media: true })}>
                    <img src={`${url}/${anime.name}/${item}`} alt="emoji" width={isMobile ? 32 : 44} />
                  </div>
              })}
            </div>
          </div>
        }
      </div>

      {/* Modal */}
      <div className="modal fade" id="pic_view" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
          <div className="modal-content bg-dark">
            <div className='model-header'>
              <button type="button" className="close px-2" data-dismiss='modal' aria-label="Close" style={{ color: 'white' }}>
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body text-center" >
              <div style={{ overflow: 'auto' }}>
                {oneImg?.includes('.mp4') ? <video controls autoPlay src={oneImg} width={isMobile ? 250 : 300} /> : <img src={oneImg} width={isMobile ? 350 : 760} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  )
}

export default Chat