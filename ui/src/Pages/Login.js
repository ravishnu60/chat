import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';
import { alert, base_url, loadingFunc } from '../Utils/Utility';
import { useNavigate } from 'react-router-dom';
import '../Style/style.css';
import logo from '../Assets/logo.png'

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
      localStorage.setItem('token', res.data.access_token);
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
    localStorage.clear();
  }, [])
  
  
  return (
    <div>
      <div className='fixed-top'>
        <div className='text-center p-2 d-flex justify-content-between align-items-center header'>
          <div> </div>
          <div className=' h5 fw-bold'>Connect <img src={logo} width={25} alt='Logo'/></div>
          <div> </div>
        </div>
      </div>
      <div className='mt-5 p-5'>
        {loadingFunc(loading)}
        <div className="row justify-content-center align-items-center">
          <div className="col-lg-4 col-11">
            <form style={{ background: 'linear-gradient(138deg,#73ebff6b,#94ff764f)' }} className={error ? 'border border-danger rounded p-3' : 'border border-success rounded p-3'} onSubmit={step ? regSubmit(registerNew) : handleSubmit(submit)}>
              {error && <div className="text-danger text-center h5">Invalid credentials</div>}
              <h5 className='bg-info p-2 text-light text-center'>{step ? "Create Account" : "Login to your Account"}</h5>
              {step === 0 ?
                <>
                  <div className="form mb-4">
                    <label className="form-label" >Mobile No.</label>
                    <input type="number"
                      className="form-control"
                      {...register('username', { required: true })} onFocus={() => { setError(false) }} />
                    {errors?.username && <div className="text-danger">Mobile number is required</div>}
                  </div>

                  <div className="form-outline mb-4">
                    <label className="form-label" >Password</label>
                    <div className='input-group'>
                      <input type={view ? "text" : "password"} autoComplete='off' className="form-control border-right-0"
                        {...register('password', { required: true })} onFocus={() => { setError(false) }} />
                      <div className='input-group-text' style={{ cursor: 'pointer' }} onClick={() => { setView(!view) }}>{view ? <i className='fa fa-eye'></i> : <i className='fa fa-eye-slash'></i>}</div>
                    </div>
                    {errors?.password && <div className="text-danger">Password is required</div>}
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
                      <div className='input-group-text' style={{ cursor: 'pointer' }} onClick={() => { setView(!view) }}>{view ? <i className='fa fa-eye'></i> : <i className='fa fa-eye-slash'></i>}</div>
                    </div>
                    {regError?.password && <div className="text-danger">Password is required</div>}
                  </div>
                </>
              }

              <div className="d-flex justify-content-around align-items-center">

                {/* <div className="form-check">
                    <input className="form-check-input" type="checkbox" value="" id="form1Example3" checked />
                    <label className="form-check-label" htmlFor="form1Example3"> Remember me </label>
                  </div> */}
                {/* <a href="#!">Forgot password?</a> */}
              </div>

              <button type="submit" className="btn btn-success  btn-block">{step ? "Sign up" : "Login"}</button>
              <button type="button" onClick={handlePage} className="btn btn-primary  btn-block">{step ? "Back" : "Sign up"}</button>
            </form>
          </div>
        </div>
      </div>
    </div>

  )
}

export default Login