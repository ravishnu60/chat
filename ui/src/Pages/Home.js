import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alert, base_url, permission, showNotification, webSocketUrl } from '../Utils/Utility';
import axios from 'axios';
import '../Style/style.css';
import findperson from '../Assets/find-person.png'
import profile from '../Assets/profile.png';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';

function Home({ props }) {
  const { user, loading, setLoading, setTo, viewProfile } = props;
  const [list, setList] = useState([]);
  const header = { "Authorization": "bearer " + sessionStorage.getItem('token') }
  const { register, formState: { errors }, reset, handleSubmit, } = useForm();
  const listRef = useRef();
  const [restartScoket, setRestartSocket] = useState(false)

  const newChat = (data) => {
    const search = data.search;
    if (search && search?.toString()?.length > 9) {
      axios({
        method: 'get',
        url: `${base_url}user/find/${search}`,
        headers: header
      }).then((res) => {
        reset();
        setTo(res.data?.data)
      }).catch(() => {
        alert("No User")
      })
    }
  }
  const deleteChat = (id) => {
    setLoading(true)
    Swal.fire({
      text: 'Are you sure you want to delete ?',
      icon: 'question',
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonColor: '#ff3d3d',
      toast: true
    }).then((result) => {
      if (result.isConfirmed) {
        axios({
          method: 'delete',
          url: `${base_url}chat/deletechat/${id}`,
          headers: header
        }).then(() => {
          alert('deleted successfully', 'success')
          setLoading(false)
        }).catch(() => {
          alert('Error while deleting')
          setLoading(false)
        })
      }
    })
  }
  const onmessage = (event) => {
    setList(JSON.parse(event.data));
    setLoading(false);
  }
  const webSocketErrorHandler = () => {
    listRef.current?.ws?.close()
    clearInterval(listRef.current?.interval)
    setLoading(false);
    setTimeout(() => {
      setRestartSocket(!restartScoket);
      setLoading(true);
    }, 15000);
  }

  useEffect(() => {
    permission !== "granted" && Notification?.requestPermission();
  }, []);

  //Notify for new messages
  useEffect(() => {
    let popup = false;
    let alive = false;
    let temp = listRef.current?.data
    if (list?.length !== 0 && listRef.current?.data) {
      temp?.forEach((element, index) => {
        if (element?.newmsg != list[index].newmsg) {
          popup = true;
        }
        if (element?.alive == false && list[index]?.alive)
          alive = true;
      });
    }
    if (popup)
      showNotification(`Excuse me ${user?.name}`, 'Some one texting you');
    if (alive)
      showNotification(`Excuse me ${user?.name}`, 'Your friends are online now');

    listRef.current = { ...listRef.current, data: list }
  }, [list])

  //websocket event
  useEffect(() => {
    if (user !== undefined) {
      const ws = new WebSocket(webSocketUrl + '/chatlist/' + user?.id);

      ws.onopen = () => {
        ws.send("Connect");
      }

      let interval = setInterval(() => {
        try {
          ws?.send("list")
        } catch {
          webSocketErrorHandler();
        }
      }, 1000);

      ws.onmessage = onmessage
      ws.onerror = webSocketErrorHandler
      ws.onclose = () => {
        listRef.current?.ws?.close()
        clearInterval(listRef.current?.interval)
      }

      listRef.current = { ws: ws, interval: interval }
    }

    return () => {
      listRef.current?.ws?.close()
      clearInterval(listRef.current?.interval)
    }

  }, [user, restartScoket])

  return (
    <>
      {/* <Notifications /> */}
      <form onSubmit={handleSubmit(newChat)}>
        <div className="input-group">
          <input type="number" className="form-control searchInput"
            autoComplete='off'
            placeholder="Enter mobile no."
            onKeyDown={e => e.key === 'e' && e.preventDefault()}
            {...register('search', { required: true, minLength: 10 })}
            aria-invalid={errors?.password ? "true" : "false"}
          />
          <div className="input-group-append">
            <button className="input-group-text py-0" type='submit' title='search' ><img src={findperson} width={30} alt='search' /></button>
          </div>
        </div>
        {errors?.search?.type == 'minLength' && <div className='text-danger'>Enter valid number</div>}
      </form>
      <div className='mt-2' style={{ cursor: 'pointer', maxHeight: '67vh', overflowX: 'hidden', overflowY: 'auto' }} >
        {
          list?.map((item, index) => (
            <div
              key={index}
              className="hoverRow border-bottom border-success rounded text-light font-weight-bold text-capitalize p-1 d-flex align-items-center"
            >
              <div className={item?.alive ? 'bg-success p-1 rounded' : 'p-1'} style={{ marginBottom: '35px' }}></div>
              <div >
                <img
                  id={`imgpr_${index}`}
                  alt='profile'
                  className='profile mx-2'
                  src={item?.profile ? item?.profile : profile}
                  onError={() => document.getElementById(`imgpr_${index}`).src = profile}
                  onClick={() => item?.profile && viewProfile(item?.profile) }
                />
              </div>
              <div className='col-8' onClick={() => { setTo({ user_id: item.user_id, name: item?.name, profile: item?.profile ? item?.profile : null }) }}>
                <div className='row'>{item?.name}
                  <span className='ml-2'>
                    {item?.newmsg !== 0 && <span className='bg-info text-light px-2 py-1 newmsgcount'>{item?.newmsg}</span>}
                  </span>
                </div>
                <div className='row'> {!item?.alive && <span className='small'>{item?.last_seen} </span>}</div>
              </div>
              <div className='col text-right'>
                <button className='btn btn-link messagedel' title='delete all text you sent' onClick={() => { deleteChat(item?.user_id) }}><i className='fa fa-trash'></i></button>
              </div>
            </div>
          ))
        }
        {(list?.length == 0 && !loading) && <div className='text-center text-secondary h4 mt-4 p-2'>No chats</div>}
      </div>

      {/* modal */}
      <button data-toggle="modal" data-target="#profile" id="modalBtn" style={{ display: 'none' }}></button>

      {/* <div className="modal" tabIndex="-1" role="dialog" id="profile" aria-hidden="true" data-backdrop="static" data-keyboard="false">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">User Profile</h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={() => (setProfile())}>
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={ProfileSubmit(updateProfile)}>
                {step == 0 ?
                  <>
                    <div className='row'>
                      <div className='col-7'>
                        <div className='col-12'>
                          <label className='text-secondary'>Name</label>
                          <input className='form-control' name='name' {...profileReg("name", { required: true })} />
                        </div>
                        <div className='col-12 mt-2'>
                          <label className='text-secondary'>Mobile No</label>
                          <input className='form-control' name='phone_no' {...profileReg("phone_no", { required: true })} />
                        </div>
                        <div className='col-12 mt-2'>

                        </div>
                      </div>
                      <div className='col-5 p-0'>
                        <div style={{ maxHeight: isMobile ? '140px' : '200px', overflow: 'hidden' }}>
                          <img
                            id="setProfilePic"
                            alt='profile'
                            onError={() => document.getElementById('setProfilePic').src = profile}
                            onClick={clickProfile}
                            src={profilePic?.url ? profilePic?.url : user?.profile ? user?.profile : profile} width={isMobile ? 100 : 140} />

                        </div>
                        <div className='mt-2 d-flex'>
                          {profilePic?.url && <>
                            <button type='button' className='btn btn-success btn-sm mr-1' onClick={updatePic}>update</button>
                            <button type='button' className='btn btn-danger btn-sm' onClick={() => setProfile()}>cancel</button>
                          </>
                          }
                          <input type='file' id='profilesel' style={{ display: 'none' }} onChange={addPic} />
                        </div>
                      </div>
                    </div>
                    <div className='mt-2'>
                      <button type='submit' className='btn  btn-sm btn-success' >Update</button>
                      <button className='btn  btn-sm btn-primary mx-1'
                        onClick={() => { setStep(1); ProfileReset({ password: null, new_password: null, confirm_pwd: null }) }}
                      >Change Password</button>
                      <button type='button' className='btn btn-primary btn-sm text-nowrap' onClick={() => document.getElementById('profilesel')?.click()}>change pic</button>
                    </div>
                  </>
                  : step !== 2 ?
                    <>
                      <div className='row'>
                        <div className='col-12'>
                          <label className='text-secondary'>Current password</label>
                          <input className='form-control' type='password' autoComplete='off' name='password' {...profileReg("password", { required: true })} />
                        </div>
                        <div className='col-12'>
                          <label className='text-secondary'>New password</label>
                          <input className='form-control' type='password' autoComplete='off' name='new_password' {...profileReg("new_password", { required: true })} />
                        </div>
                        <div className='col-12'>
                          <label className='text-secondary'>Confirm password</label>
                          <input className='form-control' name='confirm_pwd'
                            type='password' autoComplete='off'
                            {...profileReg("confirm_pwd", { required: true, validate: value => value === getValues("new_password") })} />
                          {profileErr?.confirm_pwd?.type == 'validate' && <div className='text-danger'>Password not match</div>}

                        </div>
                      </div>
                      <div className='text-center mt-2'>
                        <button type="submit" className="btn btn-sm btn-success">Update</button>
                        <button type="button" className='btn btn-sm btn-secondary ml-3' onClick={backProfile} >Back</button>
                      </div>
                    </>
                    :
                    <>
                      <div className='text-right'>
                        <button className='btn btn-sm' onClick={() => setStep(0)}><i className='fa fa-arrow-left'></i></button>
                      </div>
                      <div style={{ overflow: 'auto' }}>
                        <img src={profilePic?.urls} width={isMobile ? 350 : 500} alt='profile not found' />
                      </div>
                    </>}
              </form>
            </div>
          </div>
        </div>
      </div> */}

      {/* Model to view profile */}
      {/* <div className="modal" tabIndex="-1" role="dialog" id="profileModel" data-backdrop="static" data-keyboard="false">
        <div className="modal-dialog modal-dialog-scrollable" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Profile</h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={() => setProfile()}>
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <div style={{ overflow: 'auto' }}>
                <img src={profilePic?.urls} width={isMobile ? 350 : 500} alt='profile not found' />
              </div>
            </div>
          </div>
        </div>
      </div> */}
    </>
  )
}

export default Home