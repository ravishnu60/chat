import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alert, base_url, loadingFunc, permission, showNotification, userstatus, webSocketUrl } from '../Utils/Utility';
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
  const { register: profileReg, formState: { errors: profileErr }, reset: ProfileReset, handleSubmit: ProfileSubmit, } = useForm();
  const listRef = useRef();
  const [step, setStep] = useState(0);

  const newChat = (data) => {
    const search = data.search;
    if (search && search?.toString()?.length > 9) {
      axios({
        method: 'get',
        url: `${base_url}/find/${search}`,
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
    setUser(data?.data)
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
          url: `${base_url}/deletechat/${id}`,
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

      listRef.current = { ws: ws, interval: interval }
    }

    return () => {
      listRef.current?.ws?.close()
      clearInterval(listRef.current?.interval)
    }
  }, [user])

  useEffect(() => {
    ProfileReset(user)
    props?.click && document.getElementById('modalBtn').click();
  }, [props?.click])



  return (
    <>
      {loadingFunc(loading)}
      <Notifications />
      <form onSubmit={handleSubmit(newChat)}>
        <div class="input-group">
          <input type="number" class="form-control"
            autoComplete='off'
            placeholder="Enter mobile no."
            {...register('search', { required: true, minLength: 10 })}
            aria-invalid={errors?.password ? "true" : "false"}
          />
          <div class="input-group-append">
            <button class="input-group-text py-0" type='submit' title='search' ><img src={findperson} width={30} /></button>
          </div>
        </div>
        {errors?.search?.type == 'minLength' && <div className='text-danger'>Enter valid number</div>}
      </form>
      <div className='list-group mt-2 border border-success rounded' style={{ cursor: 'pointer', maxHeight: '67vh', overflowX: 'hidden', overflowY: 'auto' }} >
        {
          list?.map((item, index) => (
            <div
              key={index}
              className="hoverRow list-group-item text-dark font-weight-bold text-capitalize d-flex justify-content-between align-items px-1 py-1 border-bottom-0"
            ><div className={item?.alive ? 'bg-success p-1 rounded' : 'p-1'} style={{ marginBottom: '35px' }}></div>
              <div className='col-lg-11 col-10 d-flex align-items-center px-1' onClick={() => { navigate('/chat', { state: { id: item.user_id, name: item?.name } }) }}>
                <div className='profile mr-3' style={{ backgroundImage: `url(${profile})` }}></div>
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

      <div class="modal" tabindex="-1" role="dialog" id="profile" data-backdrop="static" data-keyboard="false">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">User Profile</h5>
            </div>
            <div class="modal-body">
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
                  <div className='text-center mt-2'>
                    <button type="button" class="btn btn-sm btn-success">Update</button>
                  </div>
                </div>
                <div className='col-5'>
                  <img alt='No img' /> <br/>
                  <button className='btn btn-sm btn-primary'>change</button>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button className='btn  btn-sm btn-primary'>Change Password</button>
              <button type="button" class="btn btn-sm btn-secondary" data-dismiss="modal" onClick={() => { props?.onClick(false) }}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Home