import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alert, base_url, isMobile, loadingFunc, permission, showNotification, userstatus, webSocketUrl } from '../Utils/Utility';
import axios from 'axios';
import '../Style/style.css';
import findperson from '../Assets/find-person.png'
import profile from '../Assets/profile.png';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import { Notifications } from 'react-push-notification';

function Home(props) {
  const [list, setList] = useState([]);
  const navigate = useNavigate();
  const [user, setUser] = useState();
  const [loading, setLoading] = useState(true);
  const header = { "Authorization": "bearer " + localStorage.getItem('token') }
  const { register, formState: { errors }, reset, handleSubmit, } = useForm();
  const { register: profileReg, formState: { errors: profileErr }, reset: ProfileReset, handleSubmit: ProfileSubmit, getValues } = useForm();
  const listRef = useRef();
  const [step, setStep] = useState(0);
  const [profilePic, setProfile] = useState();

  const newChat = (data) => {
    const search = data.search;
    if (search && search?.toString()?.length > 9) {
      axios({
        method: 'get',
        url: `${base_url}user/find/${search}`,
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
    setUser(data?.data);
    props?.onClick(pre => ({ ...pre, refresh: !pre.refresh }))
  };

  const deleteChat = (id) => {
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
        }).then((response) => {
          alert('deleted successfully', 'success')
        }).catch((error) => {
          alert('Error while deleting')
        })
      }
    })
  }

  useEffect(() => {
    permission !== "granted" && Notification?.requestPermission();
    getUser();
  }, []);


  const onmessage = (event) => {
    setLoading(false);
    setList(JSON.parse(event.data));

  }

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
      setLoading(true);
      const ws = new WebSocket(webSocketUrl + '/chatlist/' + user?.id);

      ws.onopen = () => {
        ws.send("Connect")
      }
      ws.onmessage = onmessage

      let interval = setInterval(() => {
        ws.send("getList")
      }, 2500);
      ws.onerror= ()=>{
        clearInterval(interval);
        setLoading(false);
      }

      listRef.current = { ws: ws, interval: interval }
    }

    return () => {
      listRef.current?.ws?.close()
      clearInterval(listRef.current?.interval)
    }
  }, [user])

  useEffect(() => {
    ProfileReset(user)
    props?.click?.click && document.getElementById('modalBtn').click();
  }, [props?.click?.click])

  const updateProfile = (data) => {
    const url = `${base_url}user/${step == 0 ? 'update' : 'password'}`;

    axios({
      method: 'put',
      url: url,
      data: data,
      headers: header
    }).then((res) => {
      console.log(res);
      if (step == 0) {
        alert('updated successfully', 'success');
        setTimeout(() => {
          getUser();
        }, 300);
      } else {
        alert('Password changed', 'success');
        setStep(0);
      }
    }).catch((err) => {
      if (step == 0) {
        alert('Error while update, try later');
      } else {
        alert(err?.response?.data?.detail);
      }
    })
  }

  const addPic = (e) => {
    if (e.target.files?.length) {
      var allowedExtensions = /(\.jpg|\.jpeg|\.png|)$/i;

      if (!allowedExtensions.exec(e.target.value)) {
        alert("Image files only");
        return;
      }
      if (e.target.files[0].size > 100e5) {
        alert("Large image files");
        return;
      }
      setProfile({ file: e.target.files[0], url: URL.createObjectURL(e.target.files[0]) });
    } else {
      setProfile();
    }
  }

  const updatePic = () => {
    const fm = new FormData();
    fm.append('source', profilePic?.file);

    axios({
      method: 'put',
      url: base_url + 'user/profilepic',
      data: fm,
      headers: header
    }).then((res) => {
      alert("profile updated", 'success');
      getUser();
      setProfile();
      window.location.reload();
    }).catch(err => {
      console.log(err);
      alert("Error, try later")
    })
  }

  return (
    <>
      {loadingFunc(loading)}
      <Notifications />
      <form onSubmit={handleSubmit(newChat)}>
        <div className="input-group">
          <input type="number" className="form-control"
            autoComplete='off'
            placeholder="Enter mobile no."
            {...register('search', { required: true, minLength: 10 })}
            aria-invalid={errors?.password ? "true" : "false"}
          />
          <div className="input-group-append">
            <button className="input-group-text py-0" type='submit' title='search' ><img src={findperson} width={30} /></button>
          </div>
        </div>
        {errors?.search?.type == 'minLength' && <div className='text-danger'>Enter valid number</div>}
      </form>
      <div className='list-group mt-2 border border-success rounded' style={{ cursor: 'pointer', maxHeight: '67vh', overflowX: 'hidden', overflowY: 'auto' }} >
        {
          list?.map((item, index) => (
            <div
              key={index}
              className="hoverRow list-group-item text-dark font-weight-bold text-capitalize d-flex align-items-center px-1 py-1 border-bottom-0"
            >
              <div className={item?.alive ? 'bg-success p-1 rounded' : 'p-1'} style={{ marginBottom: '35px' }}></div>
              
              <div className='profile mx-2' style={{ backgroundImage: `url(${item?.profile ? item?.profile : profile})` }} onClick={() => { item?.profile && setProfile({ urls: item?.profile }); document.getElementById('profileview').click() }}></div>
              
              <div className='col-lg-10 col-9 d-flex align-items-center px-1' onClick={() => { navigate('/chat', { state: { id: item.user_id, name: item?.name } }) }}>
                {item?.name}
                <span className='ml-2'>
                  {item?.newmsg !== 0 && <span className='bg-info text-light px-2 py-1 newmsgcount'>{item?.newmsg}</span>}
                </span>
              </div>
              <div className='col-lg-1 col-2 text-right'>
                <button className='btn btn-link messagedel' title='delete all text you sent' onClick={() => { deleteChat(item?.user_id) }}><i className='fa fa-trash'></i></button>
              </div>
            </div>
          ))
        }
        {(list?.length == 0 && !loading) && <div className='text-center text-secondary h4'>No chats</div>}
      </div>

      {/* modal */}
      <button data-toggle="modal" data-target="#profile" id="modalBtn" style={{ display: 'none' }}></button>

      <div className="modal" tabIndex="-1" role="dialog" id="profile" data-backdrop="static" data-keyboard="false">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">User Profile</h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={() => props?.onClick(pre => ({ ...pre, click: false }))}>
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={ProfileSubmit(updateProfile)}>
                {step == 0 ?
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
                      <div className='text-center mt-3'>
                        <button className='btn  btn-sm btn-success' >Update</button>
                        <button className='btn  btn-sm btn-primary ml-3'
                          onClick={() => { setStep(1); ProfileReset({ password: null, new_password: null, confirm_pwd: null }) }}
                        >Change Password</button>
                      </div>
                    </div>
                    <div className='col-5 text-center'>
                      <img src={profilePic ? profilePic?.url : user?.profile ? user?.profile : profile} width={140} />
                      <div className='d-flex justify-content-center'>
                        <button type='button' className='btn btn-primary btn-sm mt-4 text-nowrap' onClick={() => document.getElementById('profilesel')?.click()}>change pic</button>
                        {profilePic && <button type='button' className='btn btn-success btn-sm mt-4 ml-3' onClick={updatePic}>update</button>}
                        <input type='file' id='profilesel' style={{ display: 'none' }} onChange={addPic} />
                      </div>
                    </div>
                  </div>
                  :
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
                      <button type='button' className='btn btn-sm btn-secondary ml-3' onClick={() => { setStep(0); ProfileReset(user) }} >Back</button>
                    </div>
                  </>}
              </form>
            </div>
          </div>
        </div>
      </div>

      <button data-toggle="modal" data-target="#profileModel" id="profileview" style={{ display: 'none' }}></button>

      {/* Model to view profile */}
      <div className="modal" tabIndex="-1" role="dialog" id="profileModel" data-backdrop="static" data-keyboard="false">
        <div className="modal-dialog modal-dialog-scrollable" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Profile</h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={() => props?.onClick(pre => ({ ...pre, click: false }))}>
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
            <div style={{ overflow: 'auto' }}>
                <img src={profilePic?.urls} width={isMobile ? 350 : 500} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Home