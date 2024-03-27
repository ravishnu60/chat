import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';
import { alert, base_url, loadingFunc } from '../Utils/Utility';
import { Link, useNavigate } from 'react-router-dom';
import '../Style/login.css';
import logo from '../Assets/logo.png';
import login from '../Assets/login_side.jpg';

function Login() {
  const [error, setError] = useState(false);
  const [step, setStep] = useState(0);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const { register: reg, handleSubmit: regSubmit, formState: { errors: regError }, reset: regReset } = useForm();
  const navigate = useNavigate();
  const [view, setView] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = (data) => {
    console.log(data);
    setLoading(true);
    const formdata = new FormData();
    formdata.append('username', data.username);
    formdata.append('password', data.password);

    axios.post(`${base_url}user/login`, formdata).then((res) => {
      sessionStorage.setItem('token', res.data.access_token);
      data.remember ? localStorage.setItem('connect',JSON.stringify(data)) : localStorage.setItem('connect',null)
      setTimeout(() => {
        navigate('/home');
        setLoading(false);
      }, 300);

    }).catch(() => {
      setError(true);
      setLoading(false);
    })
  }

  const registerNew = (data) => {
    setLoading(true);
    axios({
      method: 'POST',
      url: `${base_url}user/new`,
      data: data
    }).then((res) => {
      alert('Registered successfully', true);
      setStep(0);
      reset();
      setLoading(false);
    }).catch((err) => {
      alert("Something went wrong")
      setLoading(false);
    });
  }

  const handlePage = () => {
    setError(false);
    if (step === 0) {
      setStep(1);
      regReset();
      setTimeout(() => {
        document.getElementById('register_name').value = '';
      }, 50);
    } else {
      setStep(0);
      reset();
      setTimeout(() => {
        document.getElementById('username').value = '';
      }, 50);
    }
    setView(false);
  }

  useEffect(() => {
    
    sessionStorage.clear();
    let data= localStorage.getItem('connect');
    data && reset(JSON.parse(data))
    // eslint-disable-next-line 
  }, [])


  return (
    <div>
      <div className='fixed-top'>
        <div className='p-2 text-center header'>
          <div className='h4' style={{ fontWeight: 'bolder' }}>Connect <img src={logo} width={25} alt='Logo' /></div>
        </div>
      </div>

      {loadingFunc(loading, step === 0)}

      {/* <div className={isMobile ? 'down-form':"center"}> */}
      <div className='d-flex align-items-center justify-content-center vh-100'>
        <div className="login_form" style={{ overflow: 'hidden', borderColor: error ? 'red' : 'white' }} >
          <form className='row' onSubmit={step ? regSubmit(registerNew) : handleSubmit(submit)}>
            <div className='d-none d-lg-block col-md-5 col-lg-5 col-xl-5 side-img' style={{ background: `url(${login})` }}>
              {/* side bg */}
            </div>
            <div className='col-lg-7 col-12 p-5'>
              <div className='row'>
                {error && <div className="text-danger text-center h5 col-12 font-weight-bold">Invalid credentials</div>}
                <h5 className='text-light text-center col-12 login_title'>{step ? "Create Account" : "Sign In"}</h5>
                {step === 0 ?
                  <>
                    {/* Login Form */}
                    <div className="col-12 mb-4">
                      <input type="text"
                        id='username'
                        className="form-control"
                        placeholder='Mobile No.'
                        autoComplete='off'
                        {...register('username', { required: true })}
                        onFocus={() => { setError(false) }}
                      />
                      {errors?.username && <div className="text-danger font-weight-bold">Mobile number is required</div>}
                    </div>

                    <div className="col-12 mb-3">
                      <div className='input-group'>
                        <input
                          type={view ? "text" : "password"}
                          autoComplete='off'
                          className="form-control border-right-0"
                          placeholder='Password'
                          {...register('password', { required: true })} onFocus={() => { setError(false) }} />
                        <div className='input-group-text' style={{ cursor: 'pointer' }} onClick={() => { setView(!view) }}>{view ? <i className='fa fa-eye text-light'></i> : <i className='fa fa-eye-slash text-light  '></i>}</div>
                      </div>
                      {errors?.password && <div className="text-danger font-weight-bold">Password is required</div>}
                    </div>
                    <div className='col-12 mb-4'>
                      <div className="col d-flex justify-content-between">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="remember" {...register('remember')} />
                          <label className="form-check-label" htmlFor="remember"> Remember me </label>
                        </div>
                        <div>
                          {/* <Link className='text-light font-weight-bold'>Forgot Password?</Link> */}
                        </div>
                      </div>
                    </div>
                  </>
                  :
                  <>
                    {/* Register */}
                    <div className="col-12 mb-4">
                      <input type="text"
                        id="register_name"
                        className="form-control"
                        placeholder='Name'
                        autoComplete='off'
                        {...reg('name', { required: true })} onFocus={() => { setError(false) }} />
                      {regError?.name && <div className="text-danger">Name is required</div>}
                    </div>

                    <div className="col-12  mb-4">
                      <input type="number"
                        className="form-control"
                        autoComplete='off'
                        placeholder='Mobile No.'
                        {...reg('phone_no', { required: true })} onFocus={() => { setError(false) }} />
                      {regError?.phone_no && <div className="text-danger">Mobile number is required</div>}
                    </div>

                    <div className="col-12 mb-4">
                      <div className='input-group'>
                        <input
                          type={view ? "text" : "password"}
                          autoComplete='off'
                          className="form-control border-right-0"
                          placeholder='Password'
                          {...reg('password', { required: true })} onFocus={() => { setError(false) }} />
                        <div className='input-group-text' style={{ cursor: 'pointer' }} onClick={() => { setView(!view) }}>{view ? <i className='fa fa-eye text-light'></i> : <i className='fa fa-eye-slash text-light'></i>}</div>
                      </div>
                      {regError?.password && <div className="text-danger">Password is required</div>}
                    </div>
                  </>
                }
              </div>

              <button type="submit" className="btn btn-light btn-block login-button">{step ? "Sign up" : "Login"}</button>
              <h6 className='text-light text-center mt-3'>{
                step === 0 ? <>Don't have an account? <Link className='font-weight-bold text-light text-nowrap' onClick={handlePage}>Sign up!</Link></>
                  : <>Already have an account? <Link className='font-weight-bold text-light text-nowrap' onClick={handlePage}>Sign in!</Link></>}
              </h6>
            </div>
          </form>
        </div>
      </div>
    </div>

  )
}

export default Login