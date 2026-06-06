import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';
import { alert, base_url, loadingFunc } from '../Utils/Utility';
import { Link, useNavigate } from 'react-router-dom';
import '../Style/login.css';
import logo from '../Assets/logo.png';
import Register from './Register';

function Login() {
  const [error, setError] = useState(false);
  const [step, setStep] = useState(0);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
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
      [data.username, data.password] = [btoa(data.username), btoa(data.password)];
      data.remember ? localStorage.setItem('connect', JSON.stringify(data)) : localStorage.setItem('connect', null)
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
      url: `${base_url}user/register`,
      data: data
    }).then((res) => {
      alert('Registered successfully', true);
      setStep(0);
      reset();
      setLoading(false);
    }).catch((err) => {
      setError(err?.response?.data?.detail ? err?.response?.data?.detail : true);
      if (!err?.response?.data?.detail)
        alert("Something went wrong! try later")
      setLoading(false);
    });
  }

  const handlePage = () => {
    setError(false);
    if (step === 0) {
      setStep(1);
    } else {
      setStep(0);
      reset();
    }
    setView(false);
  }

  useEffect(() => {
    sessionStorage.clear();
    let data = localStorage.getItem('connect');
    if (data) {
      data = JSON.parse(data)
      try {
        [data.username, data.password] = [atob(data.username), atob(data.password)]
      } catch (err) {
      }
      reset(data);
    }
    // eslint-disable-next-line 
  }, [])


  return (
    <div>
      {loadingFunc(loading, step === 0)}

      <div className="login-form">
        <div className={`form p-2 px-4 ${error ? 'form-error':'form-normal'}`}>
          <div className="brand-container">
            <img src={logo} width={50} className="brand-logo" alt="Logo" />
            <div className="brand-text">Connect</div>
          </div>

          {step === 0 ? <form className="" onSubmit={handleSubmit(submit)}>
            {error && <div className="text-danger text-center font-weight-bold mb-3">Invalid credentials</div>}
            <h4 className="login-title">Sign In</h4>
            <div className="row">

              <div className="col-12 mb-4">
                <input type="text"
                  id="username"
                  className="form-control borderless"
                  placeholder="Mobile No."
                  autoComplete="off"
                  {...register("username", { required: true })}
                  onFocus={() => { setError(false) }}
                />
                {errors?.username && <div className="text-danger">Mobile number is required</div>}
              </div>

              <div className="col-12 mb-4">
                <div className="input-group">
                  <input
                    type={view ? "text" : "password"}
                    autoComplete="off"
                    className="form-control borderless"
                    placeholder="Password"
                    {...register("password", { required: true })} onFocus={() => { setError(false) }} />
                  <div className="input-group-text eye-icon borderless" style={{ cursor: "pointer" }} onClick={() => { setView(!view) }}>{view ? <i className="fa fa-eye"></i> : <i className="fa fa-eye-slash"></i>}</div>
                </div>
                {errors?.password && <div className="text-danger">Password is required</div>}
              </div>

              <div className="col-12 mt-2 mb-4">
                <div className="col d-flex justify-content-between p-0">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="remember" {...register("remember")} />
                    <label className="form-check-label" htmlFor="remember"> Remember me </label>
                  </div>
                  <div>
                    {/* <Link className='text-light font-weight-bold'>Forgot Password?</Link> */}
                  </div>
                </div>
              </div>

              <div className="col-12">
                <button type="submit" className="btn btn-light float-center btn-block login-button">Login</button>
                <h6 className="text-light text-center mt-4" style={{ fontSize: "0.9rem", opacity: 0.85 }}>Don't have an account?{" "}
                  <Link className="navigation" onClick={handlePage}> <u>Sign up!</u></Link>
                </h6>
              </div>

            </div>
          </form>
            :
            <Register submit={registerNew} handlePage={handlePage} setError={setError} error={error}/>
          }
        </div>
      </div>
    </div>

  )
}

export default Login