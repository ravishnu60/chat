import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';
import '../Style/login.css';
import { Link } from 'react-router-dom';

function Register({ submit, handlePage, setError, error }) {
    const { register, handleSubmit, formState: { errors }, reset } = useForm();
    const [view, setView] = useState(false);

    useEffect(() => {
        reset();
        // eslint-disable-next-line
    }, [])

    return (
        <div>
            {error && <div className="text-danger text-center font-weight-bold">{error===true ? 'Something wrong! Try later' : error}</div>}
            <h4 className='login-title'>Register</h4>
            <form className='row' onSubmit={handleSubmit(submit)}>
                <div className="col-12 mb-4">
                    <input type="text"
                        id="register_name"
                        className="form-control borderless"
                        placeholder='Name'
                        autoComplete='off'
                        {...register('name', { required: true })} onFocus={() => { setError(false) }} />
                    {errors?.name && <div className="text-danger">Name is required</div>}
                </div>

                <div className="col-12  mb-4">
                    <input type="number"
                        className="form-control borderless"
                        autoComplete='off'
                        placeholder='Mobile No.'
                        {...register('phone_no', { required: true })} onFocus={() => { setError(false) }} />
                    {errors?.phone_no && <div className="text-danger">Mobile number is required</div>}
                </div>

                <div className="col-12 mb-4">
                    <div className='input-group'>
                        <input
                            type={view ? "text" : "password"}
                            autoComplete='off'
                            className="form-control borderless"
                            placeholder='Password'
                            {...register('password', { required: true })} onFocus={() => { setError(false) }} />
                        <div className='input-group-text eye-icon borderless' style={{ cursor: 'pointer' }} onClick={() => { setView(!view) }}>{view ? <i className='fa fa-eye'></i> : <i className='fa fa-eye-slash'></i>}</div>
                    </div>
                    {errors?.password && <div className="text-danger">Password is required</div>}
                </div>

                <div className='col-12 mt-3'>
                    <button type="submit" className="btn btn-light float-center btn-block login-button">Sign up</button>
                    <h6 className='text-light text-center mt-3'>Already have an account?
                        <Link className='navigation' onClick={handlePage}> <u>Sign in!</u></Link>
                    </h6>
                </div>
            </form>
        </div>
    )
}

export default Register