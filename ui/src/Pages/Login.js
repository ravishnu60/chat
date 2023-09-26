import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';
import { alert, base_url } from '../Utils/Utility';
import { useNavigate } from 'react-router-dom';

function Login(props) {
  const [error, setError] = useState(false);
  const [step, setStep] = useState(0);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const { register: reg, handleSubmit: regSubmit, formState: { errors: regError }, reset: regReset } = useForm();
  const navigate = useNavigate();
  const [view,setView] = useState(false);

  const submit = (data) => {
    const formdata = new FormData();
    formdata.append('username', data.username);
    formdata.append('password', data.password);

    axios.post(`${base_url}/login`, formdata).then((res) => {
      localStorage.setItem('token', res.data.access_token);
      setTimeout(() => {
        navigate('/home');
        props.setRefresh(0);
      }, 300);

    }).catch(() => {
      setError(true);
    })
  }

  const registerNew = (data) => {
    axios({
      method: 'POST',
      url: `${base_url}/new`,
      data: data
    }).then((res) => {
      alert('Registered successfully', true);
      setStep(0);
      reset();
    }).catch((err) => {

    });
  }

  const handlePage = (page) => {
    if(step == 0) {
      setStep(1);
      regReset();
    }else{
      setStep(0);
      reset();
    }
    setView(false);
  }
  useEffect(() => {
    localStorage.clear();
  }, [])

  return (
    <div className='mt-5'>
      <div className="row d-flex align-items-center justify-content-center">
        {/* <div className="col-lg-4 col-0">
              <img src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.svg"
                className="img-fluid" alt="Phone image" />
            </div> */}
        <div className="col-lg-4">
          <form className={error ? 'border border-danger rounded p-3' : 'border border-success rounded p-3'} onSubmit={step ? regSubmit(registerNew) :handleSubmit(submit)}>
            {error && <div className="text-danger text-center h5">Invalid credentials</div>}
            <h5 className='bg-info p-2 text-light text-center'>{step ? "Create Account" : "Login to your Account"}</h5>
            {step == 0 ?
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
                  <input type={view ?"text": "password"} className="form-control "
                    {...register('password', { required: true })} onFocus={() => { setError(false) }} />
                    <div className='input-group-text' style={{cursor:'pointer'}} onClick={()=>{setView(!view)}}>{view ? <i className='fa fa-eye'></i> : <i className='fa fa-eye-slash'></i>}</div>
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
                  <input type={view ?"text": "password"} className="form-control "
                    {...reg('password', { required: true })} onFocus={() => { setError(false) }} />
                    <div className='input-group-text' style={{cursor:'pointer'}} onClick={()=>{setView(!view)}}>{view ? <i className='fa fa-eye'></i> : <i className='fa fa-eye-slash'></i>}</div>
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

            <button type="submit" className="btn btn-success  btn-block">{step ? "Sign up" : "Sign in"}</button>
            <button type="button" onClick={handlePage} className="btn btn-primary  btn-block">{step ? "Back" : "Sign up"}</button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login