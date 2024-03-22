import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';
import { alert, base_url, isMobile, loadingFunc } from '../Utils/Utility';
import { Link, useNavigate } from 'react-router-dom';
import '../Style/style.css';
import logo from '../Assets/logo.png'
import bg from '../Assets/bg.png'
import login from '../Assets/login_side.jpg'

function Login() {
  const [error, setError] = useState(false);
  const [step, setStep] = useState(0);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const { register: reg, handleSubmit: regSubmit, formState: { errors: regError }, reset: regReset } = useForm();
  const navigate = useNavigate();
  const [view, setView] = useState(false);
  const [loading, setLoading] = useState(false); 

  const submit = (data) => {
    setLoading(true);
    const formdata = new FormData();
    formdata.append('username', data.username);
    formdata.append('password', data.password);

    axios.post(`${base_url}user/login`, formdata).then((res) => {
      sessionStorage.setItem('token', res.data.access_token);
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

  const handlePage = (page) => {
    if (step === 0) {
      setStep(1);
      regReset();
    } else {
      setStep(0);
      reset();
    }
    setView(false);
  }

  useEffect(() => {
    sessionStorage.clear();
  }, [])


  return (
    <div>
      <img src={bg} className='login_bg' alt='Background' />
      <div className='fixed-top'>
        <div className='p-2 text-center header'>
          <div className='h4' style={{ fontWeight: 'bolder' }}>Connect <img src={logo} width={25} alt='Logo' /></div>
        </div>
      </div>

      {loadingFunc(loading, step === 0)}

      <div className={isMobile ? 'down-form':"center"}>
        <div className="login_form" style={{ borderColor: error ? 'red' : 'white' }}>
          <form className='row' onSubmit={step ? regSubmit(registerNew) : handleSubmit(submit)}>
            <div className='col-lg-6 col-0'>
              <img src={login} style={{width:'inherit'}} alt='side' />
            </div>
            <div className='col-lg-6 col-12'>
              <div className='row'>
                {error && <div className="text-danger text-center h5 col-12 font-weight-bold">Invalid credentials</div>}
                <h5 className='text-light text-center col-12 login_title'>{step ? "Create Account" : "Login"}</h5>
                {step === 0 ?
                  <>
                    <div className="col-12 mb-4 login__inputs">
                      <input type="text"
                        className="form-control login__box"
                        placeholder='Mobile No.'
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
                  </>
                  :
                  <>
                    <div className="form mb-4">
                      <label className="form-label" >Name</label>
                      <input type="text"
                        className="form-control"
                        {...reg('name', { required: true })} onFocus={() => { setError(false) }} />
                      {regError?.name && <div className="text-danger">Name is required</div>}
                    </div>

                    <div className="form mb-4">
                      <label className="form-label" >Mobile No.</label>
                      <input type="number"
                        className="form-control"
                        {...reg('phone_no', { required: true })} onFocus={() => { setError(false) }} />
                      {regError?.phone_no && <div className="text-danger">Mobile number is required</div>}
                    </div>

                    <div className="form-outline mb-4">
                      <label className="form-label" >Password</label>
                      <div className='input-group'>
                        <input type={view ? "text" : "password"} autoComplete='off' className="form-control border-right-0"
                          {...reg('password', { required: true })} onFocus={() => { setError(false) }} />
                        <div className='input-group-text' style={{ cursor: 'pointer' }} onClick={() => { setView(!view) }}>{view ? <i className='fa fa-eye text-light'></i> : <i className='fa fa-eye-slash text-light'></i>}</div>
                      </div>
                      {regError?.password && <div className="text-danger">Password is required</div>}
                    </div>
                  </>
                }
              </div>
              <div className="d-flex justify-content-around align-items-center">
                {/* <a href="#!">Forgot password?</a> */}
              </div>

              <button type="submit" className="btn btn-light btn-block login-button">{step ? "Sign up" : "Login"}</button>
              <h6 className='text-light text-center mt-3'>Don't have an account? <Link className='font-weight-bold text-light text-nowrap' onClick={handlePage}>Sign up!</Link></h6>
              { step ? <button type="button" onClick={handlePage} className='btn btn-dark btn-block login-button'>Back</button> : null}
            </div>
          </form>
        </div>
      </div>
    </div>

  )
}

export default Login